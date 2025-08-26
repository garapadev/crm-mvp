import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para atualização de tarefa
const updateTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  estimatedHours: z.coerce.number().int().min(1).optional().nullable(),
  actualHours: z.coerce.number().int().min(1).optional().nullable(),
  tags: z.array(z.string()).optional(),
  assigneeId: z.string().optional().nullable(),
  position: z.coerce.number().int().optional(),
})

// GET /api/tasks/[id] - Buscar tarefa específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
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
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true,
            employee: {
              select: {
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

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar tarefa' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Atualizar tarefa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    const data = updateTaskSchema.parse(body)

    // Verificar se a tarefa existe
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) {
      updateData.status = data.status
      // Se o status mudou para DONE, definir completedAt
      if (data.status === 'DONE' && existingTask.status !== 'DONE') {
        updateData.completedAt = new Date()
      }
      // Se o status saiu de DONE, limpar completedAt
      if (data.status !== 'DONE' && existingTask.status === 'DONE') {
        updateData.completedAt = null
      }
    }
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId
    if (data.position !== undefined) updateData.position = data.position

    // Processar datas
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
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

    return NextResponse.json(updatedTask)

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao atualizar tarefa' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Excluir tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a tarefa existe
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    // Excluir a tarefa (comentários serão excluídos automaticamente devido ao cascade)
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Tarefa excluída com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao excluir tarefa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao excluir tarefa' },
      { status: 500 }
    )
  }
}