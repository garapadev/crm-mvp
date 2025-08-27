"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { useRouter, useParams } from "next/navigation"

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  dueDate?: string
  startDate?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  position: number
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    comments: number
  }
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
}

const taskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().int().min(1).optional(),
  actualHours: z.number().int().min(0).optional(),
  tags: z.string().optional(),
  assigneeId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'A Fazer' },
  { value: 'IN_PROGRESS', label: 'Em Progresso' },
  { value: 'REVIEW', label: 'Em Revisão' },
  { value: 'DONE', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
]

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema)
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [taskResponse, employeesResponse] = await Promise.all([
          fetch(`/api/tasks/${taskId}`),
          fetch('/api/employees?limit=100')
        ])

        if (taskResponse.ok && employeesResponse.ok) {
          const [taskData, employeesData] = await Promise.all([
            taskResponse.json(),
            employeesResponse.json()
          ])
          
          setTask(taskData)
          setEmployees(employeesData.employees || employeesData)
          
          // Preencher o formulário com os dados da tarefa
          setValue('title', taskData.title)
          setValue('description', taskData.description || '')
          setValue('status', taskData.status)
          setValue('priority', taskData.priority)
          setValue('dueDate', taskData.dueDate ? taskData.dueDate.split('T')[0] : '')
          setValue('startDate', taskData.startDate ? taskData.startDate.split('T')[0] : '')
          setValue('estimatedHours', taskData.estimatedHours || undefined)
          setValue('actualHours', taskData.actualHours || undefined)
          setValue('tags', taskData.tags.join(', '))
          setValue('assigneeId', taskData.assignee?.id || '')
          
        } else {
          toast.error('Erro ao carregar dados')
        }
      } catch (error) {
        toast.error('Erro ao conectar com o servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [taskId, setValue])

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Processar tags
      const processedData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        assigneeId: data.assigneeId || undefined,
        estimatedHours: data.estimatedHours || undefined,
        actualHours: data.actualHours || undefined,
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      })

      if (response.ok) {
        toast.success('Tarefa atualizada com sucesso!')
        router.push('/tasks')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar tarefa')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleCancel = () => {
    router.push('/tasks')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando tarefa...</span>
        </div>
      </AppLayout>
    )
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Tarefa não encontrada</h2>
          <p className="text-muted-foreground mb-6">A tarefa que você está tentando editar não foi encontrada.</p>
          <Button onClick={() => router.push('/tasks')}>Voltar para Tarefas</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Tarefa</h1>
            <p className="text-muted-foreground">
              Edite as informações de "{task.title}"
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Tarefa</CardTitle>
            <CardDescription>
              Atualize as informações da tarefa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Digite o título da tarefa"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descreva a tarefa detalhadamente"
                    rows={4}
                  />
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status e Prioridade</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={watch('status')} 
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select 
                      value={watch('priority')} 
                      onValueChange={(value) => setValue('priority', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Responsável</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="assigneeId">Responsável</Label>
                  <Select 
                    value={watch('assigneeId') || '__none__'} 
                    onValueChange={(value) => setValue('assigneeId', value === '__none__' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} ({employee.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Datas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Prazo</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate')}
                    />
                  </div>
                </div>
              </div>

              {/* Horas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Horas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Horas Estimadas</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="1"
                      {...register('estimatedHours', { valueAsNumber: true })}
                      placeholder="Ex: 8"
                    />
                    {errors.estimatedHours && (
                      <p className="text-sm text-red-500">{errors.estimatedHours.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actualHours">Horas Reais</Label>
                    <Input
                      id="actualHours"
                      type="number"
                      min="0"
                      {...register('actualHours', { valueAsNumber: true })}
                      placeholder="Ex: 6"
                    />
                    {errors.actualHours && (
                      <p className="text-sm text-red-500">{errors.actualHours.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tags</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                    placeholder="Digite as tags separadas por vírgula (ex: urgente, frontend, bug)"
                  />
                  <p className="text-sm text-muted-foreground">
                    Separe as tags com vírgulas para melhor organização
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}