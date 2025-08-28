import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContactSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
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
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'LEAD']).optional().default('ACTIVE'),
  source: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
})

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Listar contatos
 *     description: Retorna uma lista paginada de contatos com filtros opcionais
 *     tags: [Contatos]
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
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PROSPECT, CUSTOMER, LEAD]
 *         description: Filtrar por status
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filtrar por empresa
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filtrar por tags (separadas por vírgula)
 *     responses:
 *       200:
 *         description: Lista de contatos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const company = searchParams.get('company')
    const tagsParam = searchParams.get('tags')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    if (tagsParam) {
      const tags = tagsParam.split(',')
      where.tags = {
        hasSome: tags
      }
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      }),
      prisma.contact.count({ where })
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Criar novo contato
 *     description: Cria um novo contato no sistema
 *     tags: [Contatos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
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
 *       201:
 *         description: Contato criado com sucesso
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Verificar se email já existe (se fornecido)
    if (validatedData.email) {
      const existingContact = await prisma.contact.findUnique({
        where: { email: validatedData.email }
      })

      if (existingContact) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 409 }
        )
      }
    }

    const contact = await prisma.contact.create({
      data: validatedData
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}