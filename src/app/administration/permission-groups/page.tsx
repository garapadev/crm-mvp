"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Shield, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users,
  Key
} from "lucide-react"
import toast from "react-hot-toast"

interface Permission {
  id: string
  name: string
  description: string | null
  resource: string
  action: string
}

interface PermissionGroup {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: Array<{
    id: string
    permission: Permission
  }>
  employees: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  _count: {
    permissions: number
    employees: number
  }
}

export default function PermissionGroupsPage() {
  const router = useRouter()
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/permission-groups')
      if (response.ok) {
        const data = await response.json()
        setPermissionGroups(data)
      } else {
        toast.error('Erro ao carregar dados')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (group: PermissionGroup) => {
    router.push(`/administration/permission-groups/${group.id}/edit`)
  }

  const handleDelete = async (group: PermissionGroup) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/permission-groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Grupo excluído com sucesso!')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grupos de Permissão</h1>
            <p className="text-gray-600">Gerencie os grupos de permissão do sistema (RBAC)</p>
          </div>
          
          <Button onClick={() => router.push('/administration/permission-groups/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
        </div>


        {/* Lista de Grupos */}
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando grupos de permissão...</p>
          </div>
        ) : permissionGroups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum grupo de permissão encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando seu primeiro grupo de permissões
              </p>
              <Button onClick={() => router.push('/administration/permission-groups/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissionGroups.map(group => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(group)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Permissões</span>
                      </div>
                      <Badge variant="secondary">
                        {group._count.permissions}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Colaboradores</span>
                      </div>
                      <Badge variant="secondary">
                        {group._count.employees}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge 
                        variant={group.isActive ? "default" : "secondary"}
                      >
                        {group.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {group.permissions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Principais permissões:</p>
                        <div className="flex flex-wrap gap-1">
                          {group.permissions.slice(0, 3).map(p => (
                            <Badge key={p.id} variant="outline" className="text-xs">
                              {p.permission.resource}:{p.permission.action}
                            </Badge>
                          ))}
                          {group.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{group.permissions.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}