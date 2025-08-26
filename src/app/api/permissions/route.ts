import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPermissionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  resource: z.string().min(1, 'Recurso é obrigatório'),
  action: z.string().min(1, 'Ação é obrigatória'),
})

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        permissionGroups: {
          include: {
            permissionGroup: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            permissionGroups: true,
          }
        }
      },
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createPermissionSchema.parse(body)

    // Verificar se já existe permissão com mesmo recurso e ação
    const existing = await prisma.permission.findFirst({
      where: {
        resource: data.resource,
        action: data.action,
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma permissão para este recurso e ação' },
        { status: 400 }
      )
    }

    const permission = await prisma.permission.create({
      data,
      include: {
        permissionGroups: {
          include: {
            permissionGroup: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        _count: {
          select: {
            permissionGroups: true,
          }
        }
      }
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar permissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}