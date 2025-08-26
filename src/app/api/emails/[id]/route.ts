import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação para atualização de email
const updateEmailSchema = z.object({
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  folderId: z.string().optional().nullable(),
})

// GET /api/emails/[id] - Buscar email específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      )
    }

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        emailAccount: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            contentType: true,
            size: true,
            url: true,
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
          take: 5
        }
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(email)

  } catch (error) {
    console.error('Erro ao buscar email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao buscar email' },
      { status: 500 }
    )
  }
}

// PUT /api/emails/[id] - Atualizar email (marcar como lido, favoritar, mover pasta)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      )
    }

    const data = updateEmailSchema.parse(body)

    // Verificar se o email existe
    const existingEmail = await prisma.email.findUnique({
      where: { id }
    })

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}

    if (data.isRead !== undefined) updateData.isRead = data.isRead
    if (data.isStarred !== undefined) updateData.isStarred = data.isStarred
    if (data.folderId !== undefined) updateData.folderId = data.folderId

    const updatedEmail = await prisma.email.update({
      where: { id },
      data: updateData,
      include: {
        emailAccount: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          }
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            contentType: true,
            size: true,
          }
        }
      }
    })

    return NextResponse.json(updatedEmail)

  } catch (error) {
    console.error('Erro ao atualizar email:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao atualizar email' },
      { status: 500 }
    )
  }
}

// DELETE /api/emails/[id] - Excluir email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o email existe
    const existingEmail = await prisma.email.findUnique({
      where: { id }
    })

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      )
    }

    // Excluir o email (anexos serão excluídos automaticamente devido ao cascade)
    await prisma.email.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Email excluído com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro ao excluir email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao excluir email' },
      { status: 500 }
    )
  }
}