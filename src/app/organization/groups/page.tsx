"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building2, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users,
  ChevronRight,
  ChevronDown
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"

interface Group {
  id: string
  name: string
  description: string | null
  parentId: string | null
  level: number
  path: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  parent: Group | null
  children: Group[]
  employees: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  _count: {
    children: number
    employees: number
  }
}

const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

type GroupFormData = z.infer<typeof groupSchema>

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema)
  })

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      } else {
        toast.error('Erro ao carregar grupos')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const onSubmit = async (data: GroupFormData) => {
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups'
      const method = editingGroup ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(editingGroup ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!')
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setEditingGroup(null)
        reset()
        fetchGroups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setValue('name', group.name)
    setValue('description', group.description || '')
    setValue('parentId', group.parentId || '')
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (group: Group) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Grupo excluído com sucesso!')
        fetchGroups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir grupo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const buildGroupTree = (groups: Group[], parentId: string | null = null): Group[] => {
    return groups
      .filter(group => group.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const renderGroupTree = (groups: Group[], level: number = 0): React.ReactElement[] => {
    return groups.map(group => (
      <div key={group.id}>
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" style={{ marginLeft: `${level * 20}px` }}>
                {group._count.children > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(group.id)}
                    className="p-1 h-6 w-6"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Building2 className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {group._count.employees}
                </Badge>
                {group._count.children > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {group._count.children} subgrupos
                  </Badge>
                )}
                <Badge 
                  variant={group.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {group.isActive ? "Ativo" : "Inativo"}
                </Badge>
                
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
            </div>
          </CardContent>
        </Card>

        {expandedGroups.has(group.id) && group._count.children > 0 && (
          <div className="ml-4">
            {renderGroupTree(buildGroupTree(groups, group.id), level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const rootGroups = buildGroupTree(groups)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grupos Hierárquicos</h1>
            <p className="text-gray-600">Gerencie a estrutura organizacional da empresa</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Grupo</DialogTitle>
                <DialogDescription>
                  Adicione um novo grupo à estrutura organizacional
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    {...register('name')}
                    placeholder="Nome do grupo"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Descrição do grupo (opcional)"
                  />
                </div>

                <div>
                  <Label htmlFor="parentId">Grupo Pai</Label>
                  <Select onValueChange={(value) => setValue('parentId', value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Grupo raiz)</SelectItem>
                      {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {'  '.repeat(group.level)}{group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Grupo'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Grupo</DialogTitle>
              <DialogDescription>
                Atualize as informações do grupo
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  {...register('name')}
                  placeholder="Nome do grupo"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  {...register('description')}
                  placeholder="Descrição do grupo (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="parentId">Grupo Pai</Label>
                <Select 
                  onValueChange={(value) => setValue('parentId', value === 'none' ? '' : value)}
                  defaultValue={editingGroup?.parentId || 'none'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo pai (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Grupo raiz)</SelectItem>
                    {groups
                      .filter(group => group.id !== editingGroup?.id) // Não pode ser pai de si mesmo
                      .map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {'  '.repeat(group.level)}{group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingGroup(null)
                    reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Atualizando...' : 'Atualizar Grupo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lista de Grupos */}
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando grupos...</p>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum grupo encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando seu primeiro grupo organizacional
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Grupo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {renderGroupTree(rootGroups)}
          </div>
        )}
      </div>
    </AppLayout>
  )
}