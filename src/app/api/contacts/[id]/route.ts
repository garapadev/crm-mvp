import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContactSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'LEAD']).optional(),
  source: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
})

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Buscar contato por ID
 *     description: Retorna os dados de um contato específico
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Contato encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Contato não encontrado
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        leads: {
          select: {
            id: true,
            title: true,
            status: true,
            value: true,
            currency: true,
            createdAt: true,
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /contacts/{id}:
 *   put:
 *     summary: Atualizar contato
 *     description: Atualiza os dados de um contato existente
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do contato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Primeiro nome
 *               lastName:
 *                 type: string
 *                 description: Sobrenome
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do contato
 *               phone:
 *                 type: string
 *                 description: Telefone
 *               company:
 *                 type: string
 *                 description: Empresa
 *               position:
 *                 type: string
 *                 description: Cargo
 *               website:
 *                 type: string
 *                 format: uri
 *                 description: Website
 *               address:
 *                 type: string
 *                 description: Endereço
 *               city:
 *                 type: string
 *                 description: Cidade
 *               state:
 *                 type: string
 *                 description: Estado
 *               zipCode:
 *                 type: string
 *                 description: CEP
 *               country:
 *                 type: string
 *                 description: País
 *               notes:
 *                 type: string
 *                 description: Observações
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, PROSPECT, CUSTOMER, LEAD]
 *                 description: Status do contato
 *               source:
 *                 type: string
 *                 description: Origem do contato
 *               latitude:
 *                 type: number
 *                 description: Latitude
 *               longitude:
 *                 type: number
 *                 description: Longitude
 *               customFields:
 *                 type: object
 *                 description: Campos customizados
 *     responses:
 *       200:
 *         description: Contato atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Contato não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email já existe
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateContactSchema.parse(body)

    // Verificar se o contato existe
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se email já existe em outro contato (se fornecido)
    if (validatedData.email && validatedData.email !== existingContact.email) {
      const emailExists = await prisma.contact.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 409 }
        )
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Excluir contato
 *     description: Remove um contato do sistema
 *     tags: [Contatos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do contato
 *     responses:
 *       200:
 *         description: Contato excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contato excluído com sucesso
 *       404:
 *         description: Contato não encontrado
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar se o contato existe
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    await prisma.contact.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Contato excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}