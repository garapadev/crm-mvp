import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Criar permissões básicas
  const permissions = [
    { name: 'dashboard_read', resource: 'dashboard', action: 'read', description: 'Visualizar dashboard' },
    { name: 'employees_create', resource: 'employees', action: 'create', description: 'Criar colaboradores' },
    { name: 'employees_read', resource: 'employees', action: 'read', description: 'Visualizar colaboradores' },
    { name: 'employees_update', resource: 'employees', action: 'update', description: 'Editar colaboradores' },
    { name: 'employees_delete', resource: 'employees', action: 'delete', description: 'Excluir colaboradores' },
    { name: 'tasks_create', resource: 'tasks', action: 'create', description: 'Criar tarefas' },
    { name: 'tasks_read', resource: 'tasks', action: 'read', description: 'Visualizar tarefas' },
    { name: 'tasks_update', resource: 'tasks', action: 'update', description: 'Editar tarefas' },
    { name: 'tasks_delete', resource: 'tasks', action: 'delete', description: 'Excluir tarefas' },
    { name: 'webmail_read', resource: 'webmail', action: 'read', description: 'Acessar webmail' },
    { name: 'contacts_create', resource: 'contacts', action: 'create', description: 'Criar contatos' },
    { name: 'contacts_read', resource: 'contacts', action: 'read', description: 'Visualizar contatos' },
    { name: 'contacts_update', resource: 'contacts', action: 'update', description: 'Editar contatos' },
    { name: 'contacts_delete', resource: 'contacts', action: 'delete', description: 'Excluir contatos' },
    { name: 'leads_create', resource: 'leads', action: 'create', description: 'Criar leads' },
    { name: 'leads_read', resource: 'leads', action: 'read', description: 'Visualizar leads' },
    { name: 'leads_update', resource: 'leads', action: 'update', description: 'Editar leads' },
    { name: 'leads_delete', resource: 'leads', action: 'delete', description: 'Excluir leads' },
    { name: 'groups_create', resource: 'groups', action: 'create', description: 'Criar grupos' },
    { name: 'groups_read', resource: 'groups', action: 'read', description: 'Visualizar grupos' },
    { name: 'groups_update', resource: 'groups', action: 'update', description: 'Editar grupos' },
    { name: 'groups_delete', resource: 'groups', action: 'delete', description: 'Excluir grupos' },
    { name: 'permissions_create', resource: 'permissions', action: 'create', description: 'Criar permissões' },
    { name: 'permissions_read', resource: 'permissions', action: 'read', description: 'Visualizar permissões' },
    { name: 'permissions_update', resource: 'permissions', action: 'update', description: 'Editar permissões' },
    { name: 'permissions_delete', resource: 'permissions', action: 'delete', description: 'Excluir permissões' },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission
    })
  }

  // Criar grupos de permissão
  const adminGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: {
      name: 'Administrador',
      description: 'Acesso total ao sistema'
    }
  })

  const userGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Usuário' },
    update: {},
    create: {
      name: 'Usuário',
      description: 'Acesso básico ao sistema'
    }
  })

  // Associar todas as permissões ao grupo admin
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.permissionGroupPermission.upsert({
      where: {
        permissionGroupId_permissionId: {
          permissionGroupId: adminGroup.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        permissionGroupId: adminGroup.id,
        permissionId: permission.id
      }
    })
  }

  // Associar permissões básicas ao grupo usuário
  const basicPermissions = allPermissions.filter(p => 
    p.resource === 'dashboard' || 
    (p.resource === 'tasks' && p.action === 'read') ||
    (p.resource === 'contacts' && p.action === 'read') ||
    (p.resource === 'webmail' && p.action === 'read')
  )
  
  for (const permission of basicPermissions) {
    await prisma.permissionGroupPermission.upsert({
      where: {
        permissionGroupId_permissionId: {
          permissionGroupId: userGroup.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        permissionGroupId: userGroup.id,
        permissionId: permission.id
      }
    })
  }

  // Criar grupo principal
  const mainGroup = await prisma.group.upsert({
    where: { id: 'main-group-id' },
    update: {},
    create: {
      id: 'main-group-id',
      name: 'Empresa Principal',
      description: 'Grupo principal da organização',
      level: 0,
      path: '/empresa-principal'
    }
  })

  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crmmvp.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@crmmvp.com',
      password: hashedPassword
    }
  })

  // Criar colaborador admin
  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      employeeNumber: 'EMP001',
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@crmmvp.com',
      position: 'Administrador do Sistema',
      department: 'TI',
      groupId: mainGroup.id,
      permissionGroupId: adminGroup.id
    }
  })

  console.log('Seed concluído!')
  console.log('Usuário admin criado:')
  console.log('Email: admin@crmmvp.com')
  console.log('Senha: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })