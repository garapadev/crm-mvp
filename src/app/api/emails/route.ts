import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para query params
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  accountId: z.string().optional(),
  folderId: z.string().optional(),
  isRead: z.coerce.boolean().optional(),
  isStarred: z.coerce.boolean().optional(),
  hasAttachments: z.coerce.boolean().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  orderBy: z.enum(['receivedAt', 'subject', 'fromAddress']).default('receivedAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
})

// GET /api/emails - Listar emails com filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const {
      page,
      limit,
      accountId,
      folderId,
      isRead,
      isStarred,
      hasAttachments,
      search,
      fromDate,
      toDate,
      orderBy,
      orderDirection
    } = querySchema.parse(params)

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (accountId) {
      where.emailAccountId = accountId
    }

    if (folderId) {
      where.folderId = folderId
    }

    if (isRead !== undefined) {
      where.isRead = isRead
    }

    if (isStarred !== undefined) {
      where.isStarred = isStarred
    }

    if (hasAttachments !== undefined) {
      where.hasAttachments = hasAttachments
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { fromAddress: { contains: search, mode: 'insensitive' } },
        { fromName: { contains: search, mode: 'insensitive' } },
        { bodyText: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (fromDate || toDate) {
      where.receivedAt = {}
      if (fromDate) {
        where.receivedAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.receivedAt.lte = new Date(toDate)
      }
    }

    // Executar consultas em paralelo
    const [emails, totalCount] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          emailAccount: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              size: true,
            }
          },
          _count: {
            select: {
              attachments: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          [orderBy]: orderDirection
        }
      }),
      prisma.email.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    })

  } catch (error) {
    console.error('Erro ao buscar emails:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar emails' },
      { status: 500 }
    )
  }
}

// POST /api/emails/send - Enviar email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const sendEmailSchema = z.object({
      accountId: z.string().min(1, 'ID da conta é obrigatório'),
      to: z.array(z.string().email()).min(1, 'Pelo menos um destinatário é obrigatório'),
      cc: z.array(z.string().email()).optional().default([]),
      bcc: z.array(z.string().email()).optional().default([]),
      subject: z.string().min(1, 'Assunto é obrigatório'),
      bodyText: z.string().optional(),
      bodyHtml: z.string().optional(),
      replyTo: z.string().email().optional(),
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(), // Base64
        contentType: z.string(),
      })).optional().default([]),
    })

    const data = sendEmailSchema.parse(body)

    // Buscar a conta de email
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id: data.accountId }
    })

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      )
    }

    if (!emailAccount.isActive) {
      return NextResponse.json(
        { error: 'Conta de email está inativa' },
        { status: 400 }
      )
    }

    // TODO: Implementar envio real usando nodemailer
    // Por enquanto, vamos simular o envio e salvar como rascunho/enviado

    const sentEmail = await prisma.email.create({
      data: {
        messageId: `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subject: data.subject,
        fromAddress: emailAccount.email,
        fromName: emailAccount.name,
        toAddresses: data.to,
        ccAddresses: data.cc,
        bccAddresses: data.bcc,
        replyTo: data.replyTo,
        bodyText: data.bodyText,
        bodyHtml: data.bodyHtml,
        isRead: true, // Email enviado já é considerado lido
        hasAttachments: data.attachments.length > 0,
        receivedAt: new Date(),
        emailAccountId: data.accountId,
        // TODO: Associar à pasta "Enviados"
      },
      include: {
        emailAccount: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // TODO: Criar anexos se houver
    if (data.attachments.length > 0) {
      // Implementar criação de anexos
    }

    return NextResponse.json({
      message: 'Email enviado com sucesso',
      email: sentEmail
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao enviar email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao enviar email' },
      { status: 500 }
    )
  }
}