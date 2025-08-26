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
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Tag
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { useContactStore, useContactSelectors } from "@/lib/stores/contactStore"
import { AdvancedFilters } from "@/components/contacts/advanced-filters"
import { QuickSearch } from "@/components/contacts/quick-search"
import { useRouter } from "next/navigation"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  company: string | null
  position: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  website: string | null
  notes: string | null
  tags: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CUSTOMER'
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
}

const contactSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

const statusLabels = {
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  INACTIVE: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  PROSPECT: { label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
  CUSTOMER: { label: 'Cliente', color: 'bg-purple-100 text-purple-800' }
}

export default function ContactsPage() {
  const router = useRouter()
  const {
    contacts,
    loading,
    error,
    pagination,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    getFilteredContacts
  } = useContactStore()
  
  const { uniqueCompanies, uniqueCities, uniqueTags } = useContactSelectors()

  const clearFilters = () => {
    setLocalFilters({
      search: "",
      status: undefined,
      company: undefined,
      city: undefined,
      tags: [],
      dateRange: undefined
    })
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterCompany, setFilterCompany] = useState<string>("")  
  const [filters, setLocalFilters] = useState({
    search: "",
    status: undefined as string | undefined,
    company: undefined as string | undefined,
    city: undefined as string | undefined,
    tags: [] as string[],
    dateRange: undefined as { from: Date; to: Date } | undefined
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setLocalFilters({
        search: searchTerm,
        status: filterStatus === "all" ? undefined : filterStatus || undefined,
        company: filterCompany === "all" ? undefined : filterCompany || undefined,
        city: undefined,
        tags: [],
        dateRange: undefined
      })
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, filterStatus, filterCompany])

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, data)
        setIsEditDialogOpen(false)
        setEditingContact(null)
        toast.success('Contato atualizado com sucesso!')
      } else {
        await createContact(data)
        setIsCreateDialogOpen(false)
        toast.success('Contato criado com sucesso!')
      }
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar contato')
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setValue('firstName', contact.firstName)
    setValue('lastName', contact.lastName)
    setValue('email', contact.email)
    setValue('phone', contact.phone || '')
    setValue('company', contact.company || '')
    setValue('position', contact.position || '')
    setValue('address', contact.address || '')
    setValue('city', contact.city || '')
    setValue('state', contact.state || '')
    setValue('zipCode', contact.zipCode || '')
    setValue('country', contact.country || '')
    setValue('website', contact.website || '')
    setValue('notes', contact.notes || '')
    setValue('tags', contact.tags || '')
    setValue('status', contact.status)
    setValue('latitude', contact.latitude || undefined)
    setValue('longitude', contact.longitude || undefined)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (contactId: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await deleteContact(contactId)
        toast.success('Contato excluído com sucesso!')
      } catch (error: any) {
        toast.error(error.message || 'Erro ao excluir contato')
      }
    }
  }

  const resetForm = () => {
    reset()
    setEditingContact(null)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
            <p className="text-muted-foreground">
              Gerencie seus contatos e relacionamentos comerciais
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/contacts/map')}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Mapa
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Contato</DialogTitle>
                <DialogDescription>
                  Adicione um novo contato ao seu CRM
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      placeholder="Nome do contato"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      placeholder="Sobrenome do contato"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      {...register('company')}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      {...register('position')}
                      placeholder="Cargo na empresa"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Cidade"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="Estado"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="País"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => setValue('status', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROSPECT">Prospect</SelectItem>
                        <SelectItem value="CUSTOMER">Cliente</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      {...register('tags')}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Observações sobre o contato"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Contato'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Contato</DialogTitle>
                <DialogDescription>
                  Atualize as informações do contato
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      placeholder="Nome do contato"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      placeholder="Sobrenome do contato"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      {...register('company')}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      {...register('position')}
                      placeholder="Cargo na empresa"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Cidade"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="Estado"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      {...register('country')}
                      placeholder="País"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register('website')}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={editingContact?.status} 
                      onValueChange={(value) => setValue('status', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROSPECT">Prospect</SelectItem>
                        <SelectItem value="CUSTOMER">Cliente</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      {...register('tags')}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Observações sobre o contato"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false)
                      setEditingContact(null)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Atualizando...' : 'Atualizar Contato'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <QuickSearch
                  contacts={contacts}
                  onSearch={(query) => {
                    setSearchTerm(query)
                    setFilters({ ...filters, search: query })
                  }}
                  onSelectContact={(contact) => {
                     router.push(`/contacts/${contact.id}`)
                   }}
                  placeholder="Buscar contatos..."
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="CUSTOMER">Cliente</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {/* Aqui você pode adicionar as empresas dinamicamente */}
                </SelectContent>
              </Select>

              <AdvancedFilters
                filters={filters}
                onFiltersChange={setLocalFilters}
                onClearFilters={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterCompany('all')
                  clearFilters()
                }}
                companies={uniqueCompanies}
                cities={uniqueCities}
                tags={uniqueTags}
              />

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterCompany('all')
                  clearFilters()
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contatos */}
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando contatos...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">Erro: {error}</p>
              <Button onClick={() => fetchContacts()} className="mt-4">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : contacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum contato encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando seu primeiro contato
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Contato
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map(contact => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {contact.firstName} {contact.lastName}
                      </CardTitle>
                      {contact.position && contact.company && (
                        <CardDescription>
                          {contact.position} em {contact.company}
                        </CardDescription>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/contacts/${contact.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Badge 
                    className={`w-fit ${statusLabels[contact.status].color}`}
                  >
                    {statusLabels[contact.status].label}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {contact.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      {contact.company}
                    </div>
                  )}
                  
                  {(contact.city || contact.state) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {[contact.city, contact.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  
                  {contact.tags && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="h-4 w-4 mr-2" />
                      <span className="truncate">{contact.tags}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => fetchContacts(pagination.currentPage - 1)}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => fetchContacts(pagination.currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}