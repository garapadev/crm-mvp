import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  groupId: z.string().optional(),
  permissionGroupId: z.string().optional(),
  createUser: z.boolean().optional().default(false),
  userPassword: z.string().optional(),
})

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Listar colaboradores
 *     description: Retorna uma lista paginada de colaboradores com filtros opcionais
 *     tags: [Colaboradores]
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
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filtrar por grupo
 *       - in: query
 *         name: permissionGroupId
 *         schema:
 *           type: string
 *         description: Filtrar por grupo de permissão
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de colaboradores retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 employees:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
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
    const groupId = searchParams.get('groupId')
    const permissionGroupId = searchParams.get('permissionGroupId')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (groupId) {
      where.groupId = groupId
    }

    if (permissionGroupId) {
      where.permissionGroupId = permissionGroupId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          group: {
            select: {
              id: true,
              name: true,
              path: true,
            }
          },
          permissionGroup: {
            select: {
              id: true,
              name: true,
            }
          },
        },
        skip,
        take: limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      }),
      prisma.employee.count({ where })
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Criar novo colaborador
 *     description: Cria um novo colaborador no sistema, com opção de criar usuário de acesso
 *     tags: [Colaboradores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
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
 *                 description: Email do colaborador
 *               phone:
 *                 type: string
 *                 description: Telefone
 *               position:
 *                 type: string
 *                 description: Cargo
 *               department:
 *                 type: string
 *                 description: Departamento
 *               salary:
 *                 type: number
 *                 description: Salário
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 description: Data de contratação
 *               groupId:
 *                 type: string
 *                 description: ID do grupo hierárquico
 *               permissionGroupId:
 *                 type: string
 *                 description: ID do grupo de permissão
 *               createUser:
 *                 type: boolean
 *                 description: Criar usuário de acesso ao sistema
 *               userPassword:
 *                 type: string
 *                 description: Senha do usuário (obrigatória se createUser=true)
 *     responses:
 *       201:
 *         description: Colaborador criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Dados inválidos ou email já existente
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
    const data = createEmployeeSchema.parse(body)

    // Verificar se email já existe
    const existingByEmail = await prisma.employee.findUnique({
      where: { email: data.email }
    })

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'Já existe um colaborador com este email' },
        { status: 400 }
      )
    }

    // Gerar número do colaborador
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { employeeNumber: 'desc' }
    })

    let employeeNumber = 'EMP001'
    if (lastEmployee) {
      const lastNumber = parseInt(lastEmployee.employeeNumber.replace('EMP', ''))
      employeeNumber = `EMP${String(lastNumber + 1).padStart(3, '0')}`
    }

    // Preparar dados para criação
    const createData: any = {
      employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      salary: data.salary,
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      notes: data.notes,
      groupId: data.groupId,
      permissionGroupId: data.permissionGroupId,
    }

    // Criar usuário se solicitado
    let user = null
    if (data.createUser && data.userPassword) {
      const hashedPassword = await bcrypt.hash(data.userPassword, 12)
      
      user = await prisma.user.create({
        data: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: hashedPassword,
        }
      })

      createData.userId = user.id
    }

    const employee = await prisma.employee.create({
      data: createData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            path: true,
          }
        },
        permissionGroup: {
          select: {
            id: true,
            name: true,
          }
        },
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}