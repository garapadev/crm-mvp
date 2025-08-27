import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'

const prisma = new PrismaClient()

// Schema de validação para criação de conta de email
const createEmailAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  type: z.enum(['IMAP', 'POP3', 'EXCHANGE']).default('IMAP'),
  imapHost: z.string().min(1, 'Host IMAP é obrigatório'),
  imapPort: z.coerce.number().int().min(1).max(65535).default(993),
  imapSecure: z.boolean().default(true),
  smtpHost: z.string().min(1, 'Host SMTP é obrigatório'),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(true),
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  isDefault: z.boolean().default(false),
})

// Schema de validação para atualização
const updateEmailAccountSchema = createEmailAccountSchema.partial()

// Schema de validação para query params
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  employeeId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

/**
 * @swagger
 * /email-accounts:
 *   get:
 *     summary: Listar contas de email
 *     description: Retorna uma lista paginada de contas de email
 *     tags: [Webmail]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filtrar por colaborador
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de contas de email retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmailAccount'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/email-accounts - Listar contas de email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const { page, limit, employeeId, isActive } = querySchema.parse(params)
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (employeeId) {
      where.employeeId = employeeId
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Executar consultas em paralelo
    const [emailAccounts, totalCount] = await Promise.all([
      prisma.emailAccount.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.emailAccount.count({ where })
    ])

    // Remover senhas dos resultados por segurança
    const sanitizedAccounts = emailAccounts.map((account: any) => ({
      ...account,
      password: undefined, // Não retornar a senha
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      emailAccounts: sanitizedAccounts,
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
    console.error('Erro ao buscar contas de email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar contas de email' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /email-accounts:
 *   post:
 *     summary: Criar nova conta de email
 *     description: Cria uma nova conta de email para um colaborador
 *     tags: [Webmail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - imapHost
 *               - smtpHost
 *               - username
 *               - password
 *               - employeeId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da conta
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Endereço de email
 *               type:
 *                 type: string
 *                 enum: [IMAP, POP3, EXCHANGE]
 *                 default: IMAP
 *                 description: Tipo da conta
 *               imapHost:
 *                 type: string
 *                 description: Servidor IMAP
 *               imapPort:
 *                 type: integer
 *                 default: 993
 *                 description: Porta IMAP
 *               imapSecure:
 *                 type: boolean
 *                 default: true
 *                 description: SSL/TLS IMAP
 *               smtpHost:
 *                 type: string
 *                 description: Servidor SMTP
 *               smtpPort:
 *                 type: integer
 *                 default: 587
 *                 description: Porta SMTP
 *               smtpSecure:
 *                 type: boolean
 *                 default: true
 *                 description: SSL/TLS SMTP
 *               username:
 *                 type: string
 *                 description: Nome de usuário
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha da conta
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Conta padrão do colaborador
 *               employeeId:
 *                 type: string
 *                 description: ID do colaborador
 *     responses:
 *       201:
 *         description: Conta de email criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailAccount'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Colaborador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conta de email já existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/email-accounts - Criar nova conta de email
export async function POST(request: NextRequest) {
  try {
    // Obter sessão do usuário logado
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.employeeId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou não possui colaborador associado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createEmailAccountSchema.parse(body)

    // Usar o employeeId do usuário logado
    const employeeId = session.user.employeeId

    // Verificar se o colaborador existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma conta com este email para este colaborador
    const existingAccount = await prisma.emailAccount.findUnique({
      where: {
        employeeId_email: {
          employeeId: employeeId,
          email: data.email
        }
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Já existe uma conta de email com este endereço para este colaborador' },
        { status: 409 }
      )
    }

    // Se esta será a conta padrão, remover o padrão das outras contas do colaborador
    if (data.isDefault) {
      await prisma.emailAccount.updateMany({
        where: {
          employeeId: employeeId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // TODO: Em produção, criptografar a senha antes de salvar
    const emailAccount = await prisma.emailAccount.create({
      data: {
        ...data,
        employeeId: employeeId,
        type: data.type,
      },
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
      ...emailAccount,
      password: undefined,
    }

    return NextResponse.json(sanitizedAccount, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar conta de email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar conta de email' },
      { status: 500 }
    )
  }
}