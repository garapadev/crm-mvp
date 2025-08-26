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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Globe,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  lastTriggeredAt: string | null
  createdAt: string
  updatedAt: string
}

const webhookSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  events: z.array(z.string()).min(1, "Pelo menos um evento deve ser selecionado"),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
})

// Schema para o formulário sem default values
const webhookFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
})

type WebhookFormData = z.infer<typeof webhookFormSchema>

const AVAILABLE_EVENTS = [
  { value: 'EMPLOYEE_CREATED', label: 'Colaborador Criado' },
  { value: 'EMPLOYEE_UPDATED', label: 'Colaborador Atualizado' },
  { value: 'EMPLOYEE_DELETED', label: 'Colaborador Excluído' },
  { value: 'TASK_CREATED', label: 'Tarefa Criada' },
  { value: 'TASK_UPDATED', label: 'Tarefa Atualizada' },
  { value: 'TASK_DELETED', label: 'Tarefa Excluída' },
  { value: 'EMAIL_RECEIVED', label: 'Email Recebido' },
  { value: 'EMAIL_SENT', label: 'Email Enviado' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      isActive: true
    }
  })

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks)
      } else {
        toast.error('Erro ao carregar webhooks')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const onSubmit = async (data: WebhookFormData) => {
    try {
      const webhookData = {
        ...data,
        events: selectedEvents
      }

      const url = editingWebhook ? `/api/webhooks/${editingWebhook.id}` : '/api/webhooks'
      const method = editingWebhook ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })

      if (response.ok) {
        toast.success(editingWebhook ? 'Webhook atualizado com sucesso!' : 'Webhook criado com sucesso!')
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setEditingWebhook(null)
        setSelectedEvents([])
        reset()
        fetchWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar webhook')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setValue('name', webhook.name)
    setValue('url', webhook.url)
    setValue('isActive', webhook.isActive)
    setSelectedEvents(webhook.events)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (webhook: Webhook) => {
    if (!confirm(`Tem certeza que deseja excluir o webhook "${webhook.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Webhook excluído com sucesso!')
        fetchWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir webhook')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEventChange = (eventValue: string, checked: boolean) => {
    if (checked) {
      setSelectedEvents(prev => [...prev, eventValue])
    } else {
      setSelectedEvents(prev => prev.filter(e => e !== eventValue))
    }
  }

  const getSuccessRate = (webhook: Webhook) => {
    if (webhook.totalCalls === 0) return 0
    return Math.round((webhook.successfulCalls / webhook.totalCalls) * 100)
  }

  const WebhookForm = ({ title, description }: { title: string, description: string }) => (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Webhook *</Label>
          <Input
            {...register('name')}
            placeholder="Ex: Notificações Slack"
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="url">URL de Destino *</Label>
          <Input
            {...register('url')}
            placeholder="https://hooks.slack.com/services/..."
          />
          {errors.url && (
            <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="secret">Chave Secreta (opcional)</Label>
          <Input
            {...register('secret')}
            type="password"
            placeholder="Para validação HMAC SHA-256"
          />
        </div>

        <div>
          <Label>Eventos *</Label>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {AVAILABLE_EVENTS.map(event => (
              <div key={event.value} className="flex items-center space-x-2">
                <Checkbox
                  id={event.value}
                  checked={selectedEvents.includes(event.value)}
                  onCheckedChange={(checked) => handleEventChange(event.value, checked as boolean)}
                />
                <Label htmlFor={event.value} className="text-sm">
                  {event.label}
                </Label>
              </div>
            ))}
          </div>
          {selectedEvents.length === 0 && (
            <p className="text-sm text-red-600 mt-1">Selecione pelo menos um evento</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            {...register('isActive')}
            defaultChecked={true}
          />
          <Label htmlFor="isActive">Webhook ativo</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setSelectedEvents([])
              reset()
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || selectedEvents.length === 0}
          >
            {isSubmitting ? 'Salvando...' : editingWebhook ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </>
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhooks</h1>
            <p className="text-gray-600">Configure webhooks para receber notificações de eventos do sistema</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <WebhookForm 
                title="Criar Novo Webhook"
                description="Configure um webhook para receber notificações de eventos"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Webhooks */}
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando webhooks...</p>
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum webhook configurado
              </h3>
              <p className="text-gray-600 mb-4">
                Configure webhooks para receber notificações em tempo real sobre eventos do sistema
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${webhook.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <CardTitle className="text-base">{webhook.name}</CardTitle>
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {webhook.url}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(webhook)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(webhook)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status e Estatísticas */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {webhook.totalCalls}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {webhook.successfulCalls}
                      </div>
                      <div className="text-xs text-gray-500">Sucesso</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {webhook.failedCalls}
                      </div>
                      <div className="text-xs text-gray-500">Falhas</div>
                    </div>
                  </div>

                  {/* Taxa de Sucesso */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                    <Badge 
                      variant={getSuccessRate(webhook) >= 90 ? "default" : getSuccessRate(webhook) >= 70 ? "secondary" : "destructive"}
                    >
                      {getSuccessRate(webhook)}%
                    </Badge>
                  </div>

                  {/* Eventos */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Eventos:</div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 3).map(event => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                      {webhook.events.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Última Execução */}
                  {webhook.lastTriggeredAt && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Última execução:</span>
                      <span>{new Date(webhook.lastTriggeredAt).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <WebhookForm 
              title="Editar Webhook"
              description="Atualize as configurações do webhook"
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}