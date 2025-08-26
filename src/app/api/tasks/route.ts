import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para criação de tarefa
const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.coerce.number().int().min(1).optional(),
  tags: z.array(z.string()).default([]),
  assigneeId: z.string().optional(),
  position: z.coerce.number().int().default(0),
})

// Schema de validação para filtros
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assigneeId: z.string().optional(),
  createdById: z.string().optional(),
  orderBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Listar tarefas
 *     description: Retorna uma lista paginada de tarefas com filtros opcionais
 *     tags: [Tarefas]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca no título e descrição
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *         description: Filtrar por status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filtrar por prioridade
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *         description: Filtrar por responsável
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, dueDate, priority, title]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Lista de tarefas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
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
// GET /api/tasks - Listar tarefas com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const {
      page,
      limit,
      search,
      status,
      priority,
      assigneeId,
      createdById,
      orderBy,
      orderDirection
    } = querySchema.parse(params)

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (createdById) {
      where.createdById = createdById
    }

    // Executar consultas em paralelo
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          comments: {
            select: {
              id: true,
            }
          },
          _count: {
            select: {
              comments: true,
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          [orderBy]: orderDirection
        }
      }),
      prisma.task.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      tasks,
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
    console.error('Erro ao buscar tarefas:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar tarefas' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Criar nova tarefa
 *     description: Cria uma nova tarefa no sistema
 *     tags: [Tarefas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título da tarefa
 *               description:
 *                 type: string
 *                 description: Descrição detalhada
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED]
 *                 default: TODO
 *                 description: Status da tarefa
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *                 description: Prioridade da tarefa
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data de vencimento
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data de início
 *               estimatedHours:
 *                 type: integer
 *                 minimum: 1
 *                 description: Horas estimadas
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags da tarefa
 *               assigneeId:
 *                 type: string
 *                 description: ID do responsável
 *               position:
 *                 type: integer
 *                 default: 0
 *                 description: Posição no kanban
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
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
// POST /api/tasks - Criar nova tarefa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTaskSchema.parse(body)

    // Converter strings de data para Date objects
    const taskData: any = {
      ...data,
      status: data.status,
      priority: data.priority,
    }

    if (data.dueDate) {
      taskData.dueDate = new Date(data.dueDate)
    }

    if (data.startDate) {
      taskData.startDate = new Date(data.startDate)
    }

    // Se não foi especificado um criador, poderíamos pegar do token de autenticação
    // Por enquanto, vamos deixar opcional
    if (!taskData.createdById && data.assigneeId) {
      // Se não há criador mas há assignee, pode ser que o assignee seja o criador
      taskData.createdById = data.assigneeId
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            comments: true,
          }
        }
      }
    })

    return NextResponse.json(task, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao criar tarefa' },
      { status: 500 }
    )
  }
}