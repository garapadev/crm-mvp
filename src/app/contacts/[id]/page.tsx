"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Clock,
  MessageSquare,
  FileText,
  User,
  Tag,
  Plus
} from "lucide-react"
import { useContactStore } from "@/lib/stores/contactStore"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description?: string
  date: Date
  user: string
  status?: 'completed' | 'pending' | 'cancelled'
}

interface ContactDetail {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  tags: string[]
  status: 'active' | 'inactive' | 'prospect' | 'client'
  notes?: string
  createdAt: Date
  updatedAt: Date
  activities: Activity[]
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'call':
      return <Phone className="h-4 w-4" />
    case 'email':
      return <Mail className="h-4 w-4" />
    case 'meeting':
      return <Calendar className="h-4 w-4" />
    case 'note':
      return <FileText className="h-4 w-4" />
    case 'task':
      return <MessageSquare className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'call':
      return 'bg-blue-100 text-blue-800'
    case 'email':
      return 'bg-green-100 text-green-800'
    case 'meeting':
      return 'bg-purple-100 text-purple-800'
    case 'note':
      return 'bg-yellow-100 text-yellow-800'
    case 'task':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: ContactDetail['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'prospect':
      return 'bg-blue-100 text-blue-800'
    case 'client':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { contacts, updateContact, loading } = useContactStore()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ContactDetail>>({})
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'note',
    title: '',
    description: ''
  })

  useEffect(() => {
    if (params.id && contacts.length > 0) {
      const foundContact = contacts.find(c => c.id === params.id)
      if (foundContact) {
        // Simular dados de atividades para demonstração
        const contactWithActivities: ContactDetail = {
          ...foundContact,
          activities: [
            {
              id: '1',
              type: 'call',
              title: 'Ligação de follow-up',
              description: 'Discussão sobre proposta comercial',
              date: new Date(2024, 0, 15, 14, 30),
              user: 'João Silva',
              status: 'completed'
            },
            {
              id: '2',
              type: 'email',
              title: 'Envio de proposta',
              description: 'Proposta comercial enviada por email',
              date: new Date(2024, 0, 12, 9, 15),
              user: 'Maria Santos',
              status: 'completed'
            },
            {
              id: '3',
              type: 'meeting',
              title: 'Reunião de apresentação',
              description: 'Apresentação dos serviços da empresa',
              date: new Date(2024, 0, 10, 16, 0),
              user: 'Carlos Oliveira',
              status: 'completed'
            },
            {
              id: '4',
              type: 'task',
              title: 'Preparar contrato',
              description: 'Elaborar minuta do contrato de prestação de serviços',
              date: new Date(2024, 0, 20, 10, 0),
              user: 'Ana Costa',
              status: 'pending'
            }
          ]
        }
        setContact(contactWithActivities)
        setEditForm(contactWithActivities)
      } else {
        toast.error('Contato não encontrado')
        router.push('/contacts')
      }
    }
  }, [params.id, contacts, router])

  const handleEditSubmit = async () => {
    if (!contact || !editForm.name || !editForm.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }

    try {
      await updateContact(contact.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        company: editForm.company,
        position: editForm.position,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        zipCode: editForm.zipCode,
        tags: editForm.tags || [],
        status: editForm.status || 'active',
        notes: editForm.notes
      })
      
      setContact({ ...contact, ...editForm })
      setIsEditDialogOpen(false)
      toast.success('Contato atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar contato')
    }
  }

  const handleAddActivity = () => {
    if (!newActivity.title) {
      toast.error('Título da atividade é obrigatório')
      return
    }

    const activity: Activity = {
      id: Date.now().toString(),
      type: newActivity.type as Activity['type'],
      title: newActivity.title,
      description: newActivity.description,
      date: new Date(),
      user: 'Usuário Atual', // Em um app real, viria do contexto de autenticação
      status: newActivity.type === 'task' ? 'pending' : 'completed'
    }

    if (contact) {
      setContact({
        ...contact,
        activities: [activity, ...contact.activities]
      })
    }

    setNewActivity({ type: 'note', title: '', description: '' })
    setIsActivityDialogOpen(false)
    toast.success('Atividade adicionada com sucesso!')
  }

  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando contato...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/contacts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
          <p className="text-gray-600">{contact.company}</p>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Contato */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`} />
                  <AvatarFallback>
                    {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <CardDescription>{contact.position}</CardDescription>
                  <Badge className={getStatusColor(contact.status)} variant="secondary">
                    {contact.status === 'active' ? 'Ativo' :
                     contact.status === 'inactive' ? 'Inativo' :
                     contact.status === 'prospect' ? 'Prospect' : 'Cliente'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{contact.company}</span>
                </div>
              )}
              {(contact.city || contact.state) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {[contact.city, contact.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="text-xs text-gray-500">
                <p>Criado em: {format(contact.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</p>
                <p>Atualizado em: {format(contact.updatedAt, 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activities">Atividades</TabsTrigger>
              <TabsTrigger value="notes">Observações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activities" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Histórico de Atividades</h3>
                <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Atividade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Atividade</DialogTitle>
                      <DialogDescription>
                        Registre uma nova atividade para este contato.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="activity-type">Tipo</Label>
                        <Select
                          value={newActivity.type}
                          onValueChange={(value) => setNewActivity({ ...newActivity, type: value as Activity['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Ligação</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Reunião</SelectItem>
                            <SelectItem value="note">Anotação</SelectItem>
                            <SelectItem value="task">Tarefa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="activity-title">Título</Label>
                        <Input
                          id="activity-title"
                          value={newActivity.title}
                          onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                          placeholder="Título da atividade"
                        />
                      </div>
                      <div>
                        <Label htmlFor="activity-description">Descrição</Label>
                        <Textarea
                          id="activity-description"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                          placeholder="Descrição da atividade"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddActivity}>
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-3">
                {contact.activities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{activity.title}</h4>
                            {activity.status && (
                              <Badge 
                                variant={activity.status === 'completed' ? 'default' : 
                                        activity.status === 'pending' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {activity.status === 'completed' ? 'Concluído' :
                                 activity.status === 'pending' ? 'Pendente' : 'Cancelado'}
                              </Badge>
                            )}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.user}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(activity.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhuma observação registrada.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Contato</DialogTitle>
            <DialogDescription>
              Atualize as informações do contato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={editForm.company || ''}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div>
              <Label htmlFor="edit-position">Cargo</Label>
              <Input
                id="edit-position"
                value={editForm.position || ''}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                placeholder="Cargo/Função"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as ContactDetail['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label htmlFor="edit-city">Cidade</Label>
              <Input
                id="edit-city"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label htmlFor="edit-state">Estado</Label>
              <Input
                id="edit-state"
                value={editForm.state || ''}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                placeholder="Estado"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-tags">Tags (separadas por vírgula)</Label>
              <Input
                id="edit-tags"
                value={editForm.tags?.join(', ') || ''}
                onChange={(e) => setEditForm({ 
                  ...editForm, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Observações sobre o contato"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}