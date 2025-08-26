"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Shield, Save } from "lucide-react"
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

const permissionGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  permissions: z.array(z.string()),
  description: z.string().optional(),
})

type PermissionGroupFormData = z.infer<typeof permissionGroupSchema>

export default function NewPermissionGroupPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PermissionGroupFormData>({
    resolver: zodResolver(permissionGroupSchema),
    defaultValues: {
      name: '',
      permissions: [],
      description: ''
    }
  })

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      } else {
        toast.error('Erro ao carregar permissões')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [])

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

      const response = await fetch('/api/permission-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Grupo criado com sucesso!')
        router.push('/administration/permission-groups')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked 
        ? [...prev, permissionId]
        : prev.filter(id => id !== permissionId)
    )
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
          <p>Carregando permissões...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
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
            <h1 className="text-3xl font-bold text-gray-900">Criar Grupo de Permissão</h1>
            <p className="text-gray-600">Defina um novo grupo de permissões para os colaboradores</p>
          </div>
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

                  <div className="pt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Permissões selecionadas:</strong> {selectedPermissions.length}
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
                                  setSelectedPermissions(prev => prev.filter(id => !resourcePermissionIds.includes(id)))
                                } else {
                                  setSelectedPermissions(prev => [...new Set([...prev, ...resourcePermissionIds])])
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
              <span>{isSubmitting ? 'Criando...' : 'Criar Grupo'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}