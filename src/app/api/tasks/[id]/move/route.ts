import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para movimentação de tarefa
const moveTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']),
  position: z.coerce.number().int().min(0).optional(),
})

// PATCH /api/tasks/[id]/move - Mover tarefa entre colunas/status
export async function PATCH(
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

    const { status, position } = moveTaskSchema.parse(body)

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

    // Preparar dados de atualização
    const updateData: any = {
      status: status,
    }

    // Se uma posição foi especificada, atualizar
    if (position !== undefined) {
      updateData.position = position
    }

    // Se o status mudou para DONE, definir completedAt
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      updateData.completedAt = new Date()
    }
    // Se o status saiu de DONE, limpar completedAt  
    if (status !== 'DONE' && existingTask.status === 'DONE') {
      updateData.completedAt = null
    }

    // Se o status mudou para IN_PROGRESS e não havia startDate, definir agora
    if (status === 'IN_PROGRESS' && !existingTask.startDate) {
      updateData.startDate = new Date()
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
    console.error('Erro ao mover tarefa:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao mover tarefa' },
      { status: 500 }
    )
  }
}