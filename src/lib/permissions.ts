import { prisma } from "./prisma"

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            permissionGroup: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user?.employee?.permissionGroup) {
      return []
    }

    return user.employee.permissionGroup.permissions.map(
      (pg) => `${pg.permission.resource}:${pg.permission.action}`
    )
  } catch (error) {
    console.error("Erro ao buscar permissões:", error)
    return []
  }
}

export function hasPermission(userPermissions: string[], resource: string, action: string): boolean {
  const requiredPermission = `${resource}:${action}`
  const allPermission = `*:*`
  const resourceAllPermission = `${resource}:*`
  
  return userPermissions.includes(requiredPermission) || 
         userPermissions.includes(allPermission) ||
         userPermissions.includes(resourceAllPermission)
}

export function checkPermission(userPermissions: string[] | undefined, resource: string, action: string): boolean {
  if (!userPermissions) return false
  return hasPermission(userPermissions, resource, action)
}

// Hook para usar em componentes
export function usePermissions() {
  return {
    hasPermission,
    checkPermission
  }
}