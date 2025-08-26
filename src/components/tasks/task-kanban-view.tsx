"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  Clock,
  Plus
} from "lucide-react"
import { TaskFormDialog } from "./task-form-dialog"

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

interface TaskKanbanViewProps {
  tasks: Task[]
  employees: Employee[]
  onTaskMove: (id: string, newStatus: Task['status'], position?: number) => Promise<void>
  onTaskUpdate: (id: string, updates: any) => Promise<void>
  onTaskDelete: (id: string) => Promise<void>
  statusLabels: Record<string, string>
  priorityLabels: Record<string, string>
  priorityColors: Record<string, string>
}

const COLUMN_STATUSES: Task['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']

const COLUMN_COLORS = {
  TODO: 'border-gray-200 bg-gray-50',
  IN_PROGRESS: 'border-blue-200 bg-blue-50',
  REVIEW: 'border-yellow-200 bg-yellow-50',
  DONE: 'border-green-200 bg-green-50',
  CANCELLED: 'border-red-200 bg-red-50',
}

// Componente do Card da Tarefa
function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  priorityLabels, 
  priorityColors 
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  priorityLabels: Record<string, string>
  priorityColors: Record<string, string>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.dueDate && 
                   new Date(task.dueDate) < new Date() && 
                   task.status !== 'DONE'

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {task.description && (
          <CardDescription className="text-xs line-clamp-2">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Prioridade */}
          <Badge className={`${priorityColors[task.priority]} text-xs`}>
            {priorityLabels[task.priority]}
          </Badge>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Responsável */}
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                </span>
              </div>
              <span className="text-xs text-gray-700">
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {task.dueDate && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              
              {task._count.comments > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task._count.comments}</span>
                </div>
              )}
              
              {task.estimatedHours && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.actualHours || 0}h/{task.estimatedHours}h</span>
                </div>
              )}
            </div>
          </div>

          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Atrasada
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente da Coluna
function KanbanColumn({ 
  status, 
  title, 
  tasks, 
  onEdit, 
  onDelete, 
  priorityLabels, 
  priorityColors 
}: {
  status: Task['status']
  title: string
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  priorityLabels: Record<string, string>
  priorityColors: Record<string, string>
}) {
  return (
    <div className={`flex-1 rounded-lg border-2 border-dashed p-4 ${COLUMN_COLORS[status]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              priorityLabels={priorityLabels}
              priorityColors={priorityColors}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function TaskKanbanView({
  tasks,
  employees,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete,
  statusLabels,
  priorityLabels,
  priorityColors
}: TaskKanbanViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Organizar tarefas por status
  const tasksByStatus = COLUMN_STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {} as Record<Task['status'], Task[]>)

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (taskData: any) => {
    if (!editingTask) return

    await onTaskUpdate(editingTask.id, taskData)
    setIsEditDialogOpen(false)
    setEditingTask(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Encontrar a tarefa sendo movida
    const activeTask = tasks.find(task => task.id === activeId)
    if (!activeTask) return

    // Determinar o novo status
    let newStatus: Task['status'] = activeTask.status

    // Se dropou sobre uma tarefa, usar o status dessa tarefa
    const overTask = tasks.find(task => task.id === overId)
    if (overTask) {
      newStatus = overTask.status
    } else {
      // Se dropou sobre uma coluna, extrair o status do droppableId
      const columnMatch = overId.match(/column-(.+)/)
      if (columnMatch) {
        newStatus = columnMatch[1] as Task['status']
      }
    }

    // Se mudou de status, mover a tarefa
    if (newStatus !== activeTask.status) {
      await onTaskMove(activeId, newStatus)
    }
  }

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {COLUMN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={statusLabels[status]}
              tasks={tasksByStatus[status]}
              onEdit={handleEdit}
              onDelete={onTaskDelete}
              priorityLabels={priorityLabels}
              priorityColors={priorityColors}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              priorityLabels={priorityLabels}
              priorityColors={priorityColors}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialog de Edição */}
      <TaskFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditSubmit}
        employees={employees}
        priorityLabels={priorityLabels}
        task={editingTask}
        mode="edit"
      />
    </>
  )
}