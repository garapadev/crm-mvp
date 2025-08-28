import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

// Schema de validação para atualização de conta de email
const updateEmailAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  type: z.enum(['IMAP', 'POP3', 'EXCHANGE']).optional(),
  imapHost: z.string().min(1, 'Host IMAP é obrigatório').optional(),
  imapPort: z.coerce.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().optional(),
  smtpHost: z.string().min(1, 'Host SMTP é obrigatório').optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  username: z.string().min(1, 'Usuário é obrigatório').optional(),
  password: z.string().min(1, 'Senha é obrigatória').optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/email-accounts/[id] - Buscar conta de email específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta de email é obrigatório' },
        { status: 400 }
      )
    }

    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        folders: {
          select: {
            id: true,
            name: true,
            path: true,
            unreadCount: true,
            totalCount: true,
          },
          orderBy: {
            name: 'asc'
          }
        },
        _count: {
          select: {
            emails: true,
            folders: true,
          }
        }
      }
    })

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      )
    }

    // Remover senha do resultado por segurança
    const sanitizedAccount = {
      ...emailAccount,
      password: undefined,
    }

    return NextResponse.json(sanitizedAccount)

  } catch (error) {
    console.error('Erro ao buscar conta de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar conta de email' },
      { status: 500 }
    )
  }
}

// PUT /api/email-accounts/[id] - Atualizar conta de email
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta de email é obrigatório' },
        { status: 400 }
      )
    }

    const data = updateEmailAccountSchema.parse(body)

    // Verificar se a conta existe
    const existingAccount = await prisma.emailAccount.findUnique({
      where: { id }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      )
    }

    // Se está alterando para conta padrão, remover padrão das outras contas do colaborador
    if (data.isDefault === true) {
      await prisma.emailAccount.updateMany({
        where: {
          employeeId: existingAccount.employeeId,
          id: { not: id },
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.type !== undefined) updateData.type = data.type
    if (data.imapHost !== undefined) updateData.imapHost = data.imapHost
    if (data.imapPort !== undefined) updateData.imapPort = data.imapPort
    if (data.imapSecure !== undefined) updateData.imapSecure = data.imapSecure
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost
    if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort
    if (data.smtpSecure !== undefined) updateData.smtpSecure = data.smtpSecure
    if (data.username !== undefined) updateData.username = data.username
    if (data.password !== undefined) updateData.password = data.password // TODO: Criptografar
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updatedAccount = await prisma.emailAccount.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            emails: true,
            folders: true,
          }
        }
      }
    })

    // Remover senha do resultado
    const sanitizedAccount = {
      ...updatedAccount,
      password: undefined,
    }

    return NextResponse.json(sanitizedAccount)

  } catch (error) {
    console.error('Erro ao atualizar conta de email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao atualizar conta de email' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta de email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a conta existe
    const existingAccount = await prisma.emailAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            emails: true,
            folders: true,
          }
        }
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se há emails associados
    if (existingAccount._count.emails > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir a conta pois há emails associados',
          details: `Esta conta possui ${existingAccount._count.emails} emails. Exclua os emails primeiro ou desative a conta.`
        },
        { status: 409 }
      )
    }

    // Excluir a conta (folders serão excluídas automaticamente devido ao cascade)
    await prisma.emailAccount.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Conta de email excluída com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao excluir conta de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao excluir conta de email' },
      { status: 500 }
    )
  }
}