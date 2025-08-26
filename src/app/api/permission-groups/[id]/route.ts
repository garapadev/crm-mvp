import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePermissionGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const permissionGroup = await prisma.permissionGroup.findUnique({
      where: { id },
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
            position: true,
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

    if (!permissionGroup) {
      return NextResponse.json(
        { error: 'Grupo de permissão não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(permissionGroup)
  } catch (error) {
    console.error('Erro ao buscar grupo de permissão:', error)
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
    const data = updatePermissionGroupSchema.parse(body)

    // Verificar se o grupo existe
    const existingGroup = await prisma.permissionGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Grupo de permissão não encontrado' },
        { status: 404 }
      )
    }

    // Se mudou o nome, verificar se não existe outro com o mesmo nome
    if (data.name && data.name !== existingGroup.name) {
      const nameExists = await prisma.permissionGroup.findFirst({
        where: {
          name: data.name,
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Já existe um grupo de permissão com este nome' },
          { status: 400 }
        )
      }
    }

    // Atualizar dados básicos
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (Object.keys(updateData).length > 0) {
      await prisma.permissionGroup.update({
        where: { id },
        data: updateData
      })
    }

    // Atualizar permissões se fornecidas
    if (data.permissions !== undefined) {
      // Remover todas as permissões atuais
      await prisma.permissionGroupPermission.deleteMany({
        where: { permissionGroupId: id }
      })

      // Adicionar novas permissões
      if (data.permissions.length > 0) {
        await prisma.permissionGroupPermission.createMany({
          data: data.permissions.map(permissionId => ({
            permissionGroupId: id,
            permissionId,
          }))
        })
      }
    }

    const permissionGroup = await prisma.permissionGroup.update({
      where: { id },
      data: updateData,
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
            position: true,
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

    return NextResponse.json(permissionGroup)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar grupo de permissão:', error)
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
    const permissionGroup = await prisma.permissionGroup.findUnique({
      where: { id },
      include: {
        employees: true,
      }
    })

    if (!permissionGroup) {
      return NextResponse.json(
        { error: 'Grupo de permissão não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se tem colaboradores associados
    if (permissionGroup.employees.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um grupo de permissão que possui colaboradores associados' },
        { status: 400 }
      )
    }

    // Remover associações de permissões
    await prisma.permissionGroupPermission.deleteMany({
      where: { permissionGroupId: id }
    })

    await prisma.permissionGroup.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Grupo de permissão excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir grupo de permissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}