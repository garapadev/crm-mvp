"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckSquare, 
  Plus, 
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  LayoutList,
  Kanban
} from "lucide-react"
import toast from "react-hot-toast"
import { TaskTableView } from "@/components/tasks/task-table-view"
import { TaskKanbanView } from "@/components/tasks/task-kanban-view"
import { useRouter } from "next/navigation"

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

const STATUS_LABELS = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Progresso',
  REVIEW: 'Em Revisão',
  DONE: 'Concluída',
  CANCELLED: 'Cancelada'
}

const PRIORITY_LABELS = {
  LOW: 'Baixa',
  MEDIUM: 'Média', 
  HIGH: 'Alta',
  CRITICAL: 'Crítica'
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'table' | 'kanban'>('table')
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterPriority, setFilterPriority] = useState<string>("")
  const [filterAssignee, setFilterAssignee] = useState<string>("")

  // Estatísticas das tarefas
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length
  }

  const fetchData = async () => {
    try {
      const [tasksResponse, employeesResponse] = await Promise.all([
        fetch('/api/tasks?limit=100'),
        fetch('/api/employees?limit=100')
      ])

      if (tasksResponse.ok && employeesResponse.ok) {
        const [tasksData, employeesData] = await Promise.all([
          tasksResponse.json(),
          employeesResponse.json()
        ])
        setTasks(tasksData.tasks || tasksData)
        setEmployees(employeesData.employees || employeesData)
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

  const handleTaskCreate = () => {
    router.push('/tasks/new')
  }

  const handleTaskEdit = (taskId: string) => {
    router.push(`/tasks/${taskId}/edit`)
  }

  const handleTaskUpdate = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('Tarefa atualizada com sucesso!')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar tarefa')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleTaskDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Tarefa excluída com sucesso!')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir tarefa')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleTaskMove = async (id: string, newStatus: Task['status'], position?: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, position }),
      })

      if (response.ok) {
        fetchData() // Recarregar para manter sincronizado
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao mover tarefa')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filterStatus || filterStatus === '__all__' || task.status === filterStatus
    const matchesPriority = !filterPriority || filterPriority === '__all__' || task.priority === filterPriority
    const matchesAssignee = !filterAssignee || filterAssignee === '__all__' || task.assignee?.id === filterAssignee

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-gray-600">Gerencie tarefas e acompanhe o progresso</p>
          </div>
          
          <Button onClick={handleTaskCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">{taskStats.todo}</div>
              <div className="text-sm text-gray-600">A Fazer</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-gray-600">Em Progresso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{taskStats.review}</div>
              <div className="text-sm text-gray-600">Em Revisão</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as prioridades</SelectItem>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os responsáveis</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Toggle de Visualização + Conteúdo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Visualização de Tarefas</CardTitle>
              <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'table' | 'kanban')}>
                <TabsList>
                  <TabsTrigger value="table" className="flex items-center space-x-2">
                    <LayoutList className="h-4 w-4" />
                    <span>Tabela</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="flex items-center space-x-2">
                    <Kanban className="h-4 w-4" />
                    <span>Kanban</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              {activeView === 'table' 
                ? 'Visualize todas as tarefas em formato de tabela'
                : 'Organize tarefas por status com drag-and-drop'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Carregando tarefas...</p>
              </div>
            ) : (
              <>
                {activeView === 'table' && (
                  <TaskTableView
                    tasks={filteredTasks}
                    employees={employees}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    statusLabels={STATUS_LABELS}
                    priorityLabels={PRIORITY_LABELS}
                    priorityColors={PRIORITY_COLORS}
                  />
                )}
                {activeView === 'kanban' && (
                  <TaskKanbanView
                    tasks={filteredTasks}
                    employees={employees}
                    onTaskMove={handleTaskMove}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    statusLabels={STATUS_LABELS}
                    priorityLabels={PRIORITY_LABELS}
                    priorityColors={PRIORITY_COLORS}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>


    </AppLayout>
  )
}