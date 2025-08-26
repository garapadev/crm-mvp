import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para criação de webhook
const createWebhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida'),
  events: z.array(z.enum([
    'EMPLOYEE_CREATED',
    'EMPLOYEE_UPDATED', 
    'EMPLOYEE_DELETED',
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_DELETED',
    'EMAIL_RECEIVED',
    'EMAIL_SENT'
  ])).min(1, 'Pelo menos um evento deve ser selecionado'),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().default(true),
})

// Schema de validação para atualização
const updateWebhookSchema = createWebhookSchema.partial()

// Schema de validação para query params
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isActive: z.coerce.boolean().optional(),
})

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Listar webhooks
 *     description: Retorna uma lista paginada de webhooks configurados
 *     tags: [Webhooks]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de webhooks retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       events:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
// GET /api/webhooks - Listar webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const { page, limit, isActive } = querySchema.parse(params)
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    // Executar consultas em paralelo
    const [webhooks, totalCount] = await Promise.all([
      prisma.webhook.findMany({
        where,
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastTriggeredAt: true,
          totalCalls: true,
          successfulCalls: true,
          failedCalls: true,
          // Não incluir secret por segurança
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.webhook.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      webhooks,
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
    console.error('Erro ao buscar webhooks:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar webhooks' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Criar novo webhook
 *     description: Cria um novo webhook para receber notificações de eventos
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL de destino do webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_DELETED, TASK_CREATED, TASK_UPDATED, TASK_DELETED, EMAIL_RECEIVED, EMAIL_SENT]
 *                 description: Lista de eventos que acionam o webhook
 *               secret:
 *                 type: string
 *                 description: Chave secreta para validação de segurança
 *               headers:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Headers customizados para a requisição
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Status ativo/inativo do webhook
 *     responses:
 *       201:
 *         description: Webhook criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 url:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: string
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos
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
// POST /api/webhooks - Criar novo webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createWebhookSchema.parse(body)

    // Verificar se já existe um webhook com a mesma URL
    const existingWebhook = await prisma.webhook.findUnique({
      where: { url: data.url }
    })

    if (existingWebhook) {
      return NextResponse.json(
        { error: 'Já existe um webhook configurado para esta URL' },
        { status: 409 }
      )
    }

    const webhook = await prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        events: data.events,
        secret: data.secret,
        headers: data.headers || {},
        isActive: data.isActive,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
      },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar secret por segurança
      }
    })

    return NextResponse.json(webhook, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar webhook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar webhook' },
      { status: 500 }
    )
  }
}