"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  employees: Employee[]
  priorityLabels: Record<string, string>
  task?: Task | null
  mode?: 'create' | 'edit'
}

const taskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.coerce.number().int().min(1).optional(),
  actualHours: z.coerce.number().int().min(0).optional(),
  tags: z.string().optional(),
  assigneeId: z.string().optional(),
})

// Schema para o formulário sem default values
const taskFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().int().min(1).optional(),
  actualHours: z.number().int().min(0).optional(),
  tags: z.string().optional(),
  assigneeId: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskFormSchema>

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'A Fazer' },
  { value: 'IN_PROGRESS', label: 'Em Progresso' },
  { value: 'REVIEW', label: 'Em Revisão' },
  { value: 'DONE', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  employees,
  priorityLabels,
  task,
  mode = 'create'
}: TaskFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      status: 'TODO',
      priority: 'MEDIUM'
    }
  })

  // Resetar formulário quando o dialog abrir/fechar ou a tarefa mudar
  useEffect(() => {
    if (open && task && mode === 'edit') {
      setValue('title', task.title)
      setValue('description', task.description || '')
      setValue('status', task.status)
      setValue('priority', task.priority)
      setValue('dueDate', task.dueDate ? task.dueDate.split('T')[0] : '')
      setValue('startDate', task.startDate ? task.startDate.split('T')[0] : '')
      setValue('estimatedHours', task.estimatedHours || undefined)
      setValue('actualHours', task.actualHours || undefined)
      setValue('tags', task.tags.join(', '))
      setValue('assigneeId', task.assignee?.id || '')
    } else if (open && mode === 'create') {
      reset()
    }
  }, [open, task, mode, setValue, reset])

  const onFormSubmit = async (data: TaskFormData) => {
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

      await onSubmit(processedData)
      reset()
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Edite as informações da tarefa'
              : 'Preencha as informações para criar uma nova tarefa'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              {...register('title')}
              placeholder="Digite o título da tarefa"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              {...register('description')}
              placeholder="Descreva a tarefa detalhadamente"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => setValue('status', value as any)}>
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

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select onValueChange={(value) => setValue('priority', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="assigneeId">Responsável</Label>
            <Select onValueChange={(value) => setValue('assigneeId', value === '__none__' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Não atribuir</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                {...register('startDate')}
                type="date"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Prazo</Label>
              <Input
                {...register('dueDate')}
                type="date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedHours">Horas Estimadas</Label>
              <Input
                {...register('estimatedHours')}
                type="number"
                min="1"
                placeholder="Ex: 8"
              />
            </div>

            {mode === 'edit' && (
              <div>
                <Label htmlFor="actualHours">Horas Trabalhadas</Label>
                <Input
                  {...register('actualHours')}
                  type="number"
                  min="0"
                  placeholder="Ex: 4"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              {...register('tags')}
              placeholder="Separe as tags com vírgula (ex: urgente, backend, bug)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe múltiplas tags com vírgula
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                reset()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (mode === 'edit' ? 'Salvando...' : 'Criando...')
                : (mode === 'edit' ? 'Salvar Alterações' : 'Criar Tarefa')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}