"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  Clock
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

interface TaskTableViewProps {
  tasks: Task[]
  employees: Employee[]
  onTaskUpdate: (id: string, updates: any) => Promise<void>
  onTaskDelete: (id: string) => Promise<void>
  statusLabels: Record<string, string>
  priorityLabels: Record<string, string>
  priorityColors: Record<string, string>
}

export function TaskTableView({
  tasks,
  employees,
  onTaskUpdate,
  onTaskDelete,
  statusLabels,
  priorityLabels,
  priorityColors
}: TaskTableViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isOverdue = (task: Task) => {
    return task.dueDate && 
           new Date(task.dueDate) < new Date() && 
           task.status !== 'DONE'
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">Nenhuma tarefa encontrada</div>
        <div className="text-sm text-gray-400">
          Tente ajustar os filtros ou criar uma nova tarefa
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Tarefa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow 
                key={task.id}
                className={isOverdue(task) ? "bg-red-50" : ""}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 truncate max-w-[250px]">
                        {task.description}
                      </div>
                    )}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge
                    variant={
                      task.status === 'DONE' ? 'default' :
                      task.status === 'IN_PROGRESS' ? 'secondary' :
                      task.status === 'REVIEW' ? 'outline' :
                      'secondary'
                    }
                  >
                    {statusLabels[task.status]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <Badge className={priorityColors[task.priority]}>
                    {priorityLabels[task.priority]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {task.assignee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {task.assignee.firstName} {task.assignee.lastName}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Não atribuída</div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {task.dueDate ? (
                      <div className={`flex items-center space-x-1 ${isOverdue(task) ? 'text-red-600' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.dueDate)}</span>
                        {isOverdue(task) && (
                          <Badge variant="destructive" className="text-xs ml-1">
                            Atrasada
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Sem prazo</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {task.estimatedHours && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{task.actualHours || 0}h/{task.estimatedHours}h</span>
                      </div>
                    )}
                    {task._count.comments > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        <span>{task._count.comments}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onTaskDelete(task.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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