import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        parent: true,
        children: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            children: true,
            employees: true,
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Erro ao buscar grupos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createGroupSchema.parse(body)

    // Calcular nível e caminho baseado no pai
    let level = 0
    let path = `/${data.name.toLowerCase().replace(/\s+/g, '-')}`

    if (data.parentId) {
      const parent = await prisma.group.findUnique({
        where: { id: data.parentId }
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Grupo pai não encontrado' },
          { status: 404 }
        )
      }

      level = parent.level + 1
      path = `${parent.path}/${data.name.toLowerCase().replace(/\s+/g, '-')}`
    }

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        level,
        path,
      },
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

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar grupo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}