"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Shield, Save, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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

const permissionGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  permissions: z.array(z.string()),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type PermissionGroupFormData = z.infer<typeof permissionGroupSchema>

export default function EditPermissionGroupPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string
  
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [group, setGroup] = useState<PermissionGroup | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PermissionGroupFormData>({
    resolver: zodResolver(permissionGroupSchema),
    defaultValues: {
      name: '',
      permissions: [],
      description: '',
      isActive: true
    }
  })

  const isActive = watch('isActive')

  const fetchData = async () => {
    try {
      const [groupResponse, permissionsResponse] = await Promise.all([
        fetch(`/api/permission-groups/${groupId}`),
        fetch('/api/permissions')
      ])

      if (groupResponse.ok && permissionsResponse.ok) {
        const [groupData, permissionsData] = await Promise.all([
          groupResponse.json(),
          permissionsResponse.json()
        ])
        
        setGroup(groupData)
        setPermissions(permissionsData)
        
        // Preencher formulário com dados do grupo
        setValue('name', groupData.name)
        setValue('description', groupData.description || '')
        setValue('isActive', groupData.isActive)
        
        const groupPermissionIds = groupData.permissions.map((p: any) => p.permission.id)
        setSelectedPermissions(groupPermissionIds)
        setValue('permissions', groupPermissionIds)
      } else {
        toast.error('Erro ao carregar dados')
        router.push('/administration/permission-groups')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
      router.push('/administration/permission-groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (groupId) {
      fetchData()
    }
  }, [groupId])

  const onSubmit = async (data: PermissionGroupFormData) => {
    if (selectedPermissions.length === 0) {
      toast.error('Selecione pelo menos uma permissão')
      return
    }

    try {
      const payload = {
        ...data,
        permissions: selectedPermissions
      }

      const response = await fetch(`/api/permission-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Grupo atualizado com sucesso!')
        router.push('/administration/permission-groups')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleDelete = async () => {
    if (!group) return

    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/permission-groups/${groupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Grupo excluído com sucesso!')
        router.push('/administration/permission-groups')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      const newPermissions = checked 
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId)
      
      setValue('permissions', newPermissions)
      return newPermissions
    })
  }

  const groupPermissionsByResource = (permissions: Permission[]) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  const groupedPermissions = groupPermissionsByResource(permissions)

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p>Carregando dados do grupo...</p>
        </div>
      </AppLayout>
    )
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p>Grupo não encontrado</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Grupo de Permissão</h1>
              <p className="text-gray-600">Atualize as informações e permissões do grupo "{group.name}"</p>
            </div>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir Grupo</span>
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Básicas */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Informações Básicas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Grupo *</Label>
                    <Input
                      {...register('name')}
                      placeholder="Ex: Gerentes, Vendedores, Analistas"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      {...register('description')}
                      placeholder="Descreva o propósito e responsabilidades do grupo (opcional)"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Grupo Ativo</Label>
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                    />
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Permissões selecionadas:</strong> {selectedPermissions.length}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Colaboradores vinculados:</strong> {group._count.employees}
                    </p>
                    {selectedPermissions.length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        Selecione pelo menos uma permissão
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Permissões */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Permissões do Sistema</CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecione as permissões que este grupo deve ter acesso
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                      <div key={resource} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-lg capitalize text-gray-800">
                            {resource}
                          </h4>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const resourcePermissionIds = resourcePermissions.map(p => p.id)
                                const allSelected = resourcePermissionIds.every(id => selectedPermissions.includes(id))
                                if (allSelected) {
                                  const newPermissions = selectedPermissions.filter(id => !resourcePermissionIds.includes(id))
                                  setSelectedPermissions(newPermissions)
                                  setValue('permissions', newPermissions)
                                } else {
                                  const newPermissions = [...new Set([...selectedPermissions, ...resourcePermissionIds])]
                                  setSelectedPermissions(newPermissions)
                                  setValue('permissions', newPermissions)
                                }
                              }}
                            >
                              {resourcePermissions.every(p => selectedPermissions.includes(p.id)) ? 'Desmarcar Todas' : 'Selecionar Todas'}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {resourcePermissions.map(permission => (
                            <div key={permission.id} className="flex items-start space-x-3 p-2 rounded border hover:bg-gray-50">
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <label 
                                  htmlFor={permission.id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permission.name}
                                </label>
                                {permission.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/administration/permission-groups')}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedPermissions.length === 0}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}