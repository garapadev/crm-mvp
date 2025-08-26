"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  CheckSquare, 
  Mail, 
  Plus,
  Calendar,
  BarChart3
} from "lucide-react"

// Mock data - em produção seria vindo da API
const mockData = {
  employees: 12,
  tasks: {
    total: 45,
    completed: 23,
    inProgress: 15,
    todo: 7
  },
  emails: {
    unread: 8,
    total: 156
  }
}

const quickActions = [
  { name: "Novo Colaborador", href: "/employees/new", icon: Users, color: "bg-blue-500" },
  { name: "Nova Tarefa", href: "/tasks/new", icon: CheckSquare, color: "bg-green-500" },
]

const recentActivities = [
  {
    id: 1,
    type: "task",
    message: "Tarefa 'Revisar propostas' foi concluída",
    time: "há 2 horas",
    user: "João Silva"
  },
  {
    id: 2,
    type: "email",
    message: "Novo email recebido de cliente@empresa.com",
    time: "há 3 horas",
    user: "Sistema"
  },
]

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo ao seu painel de controle</p>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.employees}</div>
              <p className="text-xs text-muted-foreground">Ativos no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.tasks.total}</div>
              <div className="flex space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {mockData.tasks.completed} Concluídas
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {mockData.tasks.inProgress} Em andamento
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">E-mails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockData.emails.unread}</div>
              <p className="text-xs text-muted-foreground">
                Não lidos de {mockData.emails.total} total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as funcionalidades mais usadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.name}
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={action.href}>
                    <div className={`w-8 h-8 rounded-md ${action.color} flex items-center justify-center mr-3`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    {action.name}
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Atividades Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>
                Últimas ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.user}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e relatórios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Desempenho de Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Concluídas</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(mockData.tasks.completed / mockData.tasks.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{mockData.tasks.completed}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Em Progresso</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(mockData.tasks.inProgress / mockData.tasks.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{mockData.tasks.inProgress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendentes</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${(mockData.tasks.todo / mockData.tasks.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{mockData.tasks.todo}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Próximas Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Reunião com cliente</p>
                    <p className="text-xs text-gray-500">Hoje, 15:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Revisar propostas</p>
                    <p className="text-xs text-gray-500">Amanhã, 09:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Follow-up leads</p>
                    <p className="text-xs text-gray-500">Sexta, 14:00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}