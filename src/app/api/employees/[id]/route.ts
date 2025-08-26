import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
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
  groupId: z.string().optional().nullable(),
  permissionGroupId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            createdAt: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            path: true,
            description: true,
          }
        },
        permissionGroup: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        createdTasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        emailAccounts: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          }
        },
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
            emailAccounts: true,
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error)
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
    const data = updateEmployeeSchema.parse(body)

    // Verificar se o colaborador existe
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Se mudou o email, verificar se não existe outro com o mesmo email
    if (data.email && data.email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findFirst({
        where: {
          email: data.email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Já existe um colaborador com este email' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    Object.keys(data).forEach(key => {
      const value = (data as any)[key]
      if (value !== undefined) {
        if (key === 'hireDate' || key === 'birthDate') {
          updateData[key] = value ? new Date(value) : null
        } else {
          updateData[key] = value
        }
      }
    })

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(employee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar colaborador:', error)
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
    // Verificar se o colaborador existe
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        assignedTasks: true,
        createdTasks: true,
        emailAccounts: true,
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se tem tarefas ou outros dados vinculados
    if (employee.assignedTasks.length > 0 || employee.createdTasks.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um colaborador que possui tarefas vinculadas. Desative o colaborador em vez de excluí-lo.' },
        { status: 400 }
      )
    }

    // Remover contas de email vinculadas
    if (employee.emailAccounts.length > 0) {
      await prisma.emailAccount.deleteMany({
        where: { employeeId: id }
      })
    }

    // Excluir o colaborador
    await prisma.employee.delete({
      where: { id }
    })

    // Se tinha usuário vinculado, excluir também (opcional - pode ser configurável)
    if (employee.userId) {
      await prisma.user.delete({
        where: { id: employee.userId }
      }).catch(() => {
        // Ignorar erro se usuário não puder ser excluído
        console.log('Usuário não pôde ser excluído automaticamente')
      })
    }

    return NextResponse.json({ message: 'Colaborador excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}