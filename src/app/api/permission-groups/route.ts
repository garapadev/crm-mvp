import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPermissionGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional().default([]),
})

export async function GET() {
  try {
    const permissionGroups = await prisma.permissionGroup.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
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
            permissions: true,
            employees: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(permissionGroups)
  } catch (error) {
    console.error('Erro ao buscar grupos de permissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createPermissionGroupSchema.parse(body)

    // Verificar se já existe grupo com mesmo nome
    const existing = await prisma.permissionGroup.findUnique({
      where: { name: data.name }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um grupo de permissão com este nome' },
        { status: 400 }
      )
    }

    // Criar o grupo
    const permissionGroup = await prisma.permissionGroup.create({
      data: {
        name: data.name,
        description: data.description,
      }
    })

    // Associar permissões se fornecidas
    if (data.permissions.length > 0) {
      await prisma.permissionGroupPermission.createMany({
        data: data.permissions.map(permissionId => ({
          permissionGroupId: permissionGroup.id,
          permissionId,
        }))
      })
    }

    // Buscar o grupo criado com relacionamentos
    const result = await prisma.permissionGroup.findUnique({
      where: { id: permissionGroup.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            permissions: true,
            employees: true,
          }
        }
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar grupo de permissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}