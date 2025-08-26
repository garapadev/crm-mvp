import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para atualização
const updateWebhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  url: z.string().url('URL inválida').optional(),
  events: z.array(z.enum([
    'EMPLOYEE_CREATED',
    'EMPLOYEE_UPDATED', 
    'EMPLOYEE_DELETED',
    'TASK_CREATED',
    'TASK_UPDATED',
    'TASK_DELETED',
    'EMAIL_RECEIVED',
    'EMAIL_SENT'
  ])).min(1, 'Pelo menos um evento deve ser selecionado').optional(),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
})

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Obter webhook específico
 *     description: Retorna os detalhes de um webhook específico
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Webhook encontrado
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
 *                 totalCalls:
 *                   type: integer
 *                 successfulCalls:
 *                   type: integer
 *                 failedCalls:
 *                   type: integer
 *                 lastTriggeredAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Webhook não encontrado
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
// GET /api/webhooks/[id] - Obter webhook específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do webhook é obrigatório' },
        { status: 400 }
      )
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        headers: true,
        createdAt: true,
        updatedAt: true,
        lastTriggeredAt: true,
        totalCalls: true,
        successfulCalls: true,
        failedCalls: true,
        // Não incluir secret por segurança
      }
    })

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(webhook)

  } catch (error) {
    console.error('Erro ao buscar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar webhook' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /webhooks/{id}:
 *   put:
 *     summary: Atualizar webhook
 *     description: Atualiza um webhook existente
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 description: Status ativo/inativo do webhook
 *     responses:
 *       200:
 *         description: Webhook atualizado com sucesso
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
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Webhook não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: URL já existe em outro webhook
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
// PUT /api/webhooks/[id] - Atualizar webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateWebhookSchema.parse(body)

    if (!id) {
      return NextResponse.json(
        { error: 'ID do webhook é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se webhook existe
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id }
    })

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    // Se URL foi alterada, verificar se não existe outro webhook com a mesma URL
    if (data.url && data.url !== existingWebhook.url) {
      const webhookWithSameUrl = await prisma.webhook.findFirst({
        where: {
          url: data.url,
          id: { not: id }
        }
      })

      if (webhookWithSameUrl) {
        return NextResponse.json(
          { error: 'Já existe outro webhook configurado para esta URL' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.url !== undefined) updateData.url = data.url
    if (data.events !== undefined) updateData.events = data.events
    if (data.secret !== undefined) updateData.secret = data.secret
    if (data.headers !== undefined) updateData.headers = data.headers
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(webhook)

  } catch (error) {
    console.error('Erro ao atualizar webhook:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao atualizar webhook' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Excluir webhook
 *     description: Remove um webhook do sistema
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do webhook
 *     responses:
 *       200:
 *         description: Webhook excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Webhook excluído com sucesso"
 *       404:
 *         description: Webhook não encontrado
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
// DELETE /api/webhooks/[id] - Excluir webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do webhook é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se webhook existe
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id }
    })

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      )
    }

    // Excluir webhook e logs relacionados
    await prisma.$transaction([
      prisma.webhookLog.deleteMany({
        where: { webhookId: id }
      }),
      prisma.webhook.delete({
        where: { id }
      })
    ])

    return NextResponse.json({
      message: 'Webhook excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao excluir webhook' },
      { status: 500 }
    )
  }
}