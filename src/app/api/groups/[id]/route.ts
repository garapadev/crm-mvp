import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                children: true,
                employees: true,
              }
            }
          }
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          }
        },
        _count: {
          select: {
            children: true,
            employees: true,
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Erro ao buscar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateGroupSchema.parse(body)

    // Verificar se o grupo existe
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      )
    }

    // Se mudou o pai, recalcular nível e caminho
    let updateData: any = { ...data }
    
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        return NextResponse.json(
          { error: 'Um grupo não pode ser pai dele mesmo' },
          { status: 400 }
        )
      }

      let level = 0
      let path = `/${(data.name || existingGroup.name).toLowerCase().replace(/\s+/g, '-')}`

      if (data.parentId) {
        // Verificar se não cria ciclo
        const parent = await prisma.group.findUnique({
          where: { id: data.parentId }
        })

        if (!parent) {
          return NextResponse.json(
            { error: 'Grupo pai não encontrado' },
            { status: 404 }
          )
        }

        // Verificar se o pai não é um descendente do grupo atual
        const isDescendant = await checkIfDescendant(id, data.parentId)
        if (isDescendant) {
          return NextResponse.json(
            { error: 'Não é possível mover um grupo para ser filho de seus descendentes' },
            { status: 400 }
          )
        }

        level = parent.level + 1
        path = `${parent.path}/${(data.name || existingGroup.name).toLowerCase().replace(/\s+/g, '-')}`
      }

      updateData.level = level
      updateData.path = path
    } else if (data.name && data.name !== existingGroup.name) {
      // Se só mudou o nome, atualizar o caminho
      const pathSegments = existingGroup.path.split('/')
      pathSegments[pathSegments.length - 1] = data.name.toLowerCase().replace(/\s+/g, '-')
      updateData.path = pathSegments.join('/')
    }

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            children: true,
            employees: true,
          }
        }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    // Verificar se o grupo existe
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        children: true,
        employees: true,
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se tem filhos ou colaboradores
    if (group.children.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um grupo que possui subgrupos' },
        { status: 400 }
      )
    }

    if (group.employees.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um grupo que possui colaboradores' },
        { status: 400 }
      )
    }

    await prisma.group.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Grupo excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para verificar se um grupo é descendente de outro
async function checkIfDescendant(ancestorId: string, potentialDescendantId: string): Promise<boolean> {
  const potentialDescendant = await prisma.group.findUnique({
    where: { id: potentialDescendantId },
    include: { parent: true }
  })

  if (!potentialDescendant || !potentialDescendant.parent) {
    return false
  }

  if (potentialDescendant.parent.id === ancestorId) {
    return true
  }

  return checkIfDescendant(ancestorId, potentialDescendant.parent.id)
}