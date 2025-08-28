"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import toast from "react-hot-toast"
import { useContactStore, useContactSelectors } from "@/lib/stores/contactStore"
import { AdvancedFilters } from "@/components/contacts/advanced-filters"
import { QuickSearch } from "@/components/contacts/quick-search"
import { useRouter } from "next/navigation"

const statusLabels = {
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  INACTIVE: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  PROSPECT: { label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
  CUSTOMER: { label: 'Cliente', color: 'bg-purple-100 text-purple-800' }
}

export default function ContactsPage() {
  const router = useRouter()
  const store = useContactStore()
  const { filteredContacts, uniqueCompanies, uniqueCities } = useContactSelectors()
  
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: undefined as string | undefined,
    company: undefined as string | undefined,
    city: undefined as string | undefined,
    tags: [] as string[]
  })

  useEffect(() => {
    store.fetchContacts()
  }, [])

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await store.deleteContact(contactId)
        toast.success('Contato excluído com sucesso!')
      } catch (error) {
        toast.error('Erro ao excluir contato')
      }
    }
  }

  const handleEditContact = (contactId: string) => {
    router.push(`/contacts/${contactId}/edit`)
  }

  const handleViewContact = (contactId: string) => {
    router.push(`/contacts/${contactId}`)
  }

  const handleCreateContact = () => {
    router.push('/contacts/new')
  }

  if (store.isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando contatos...</div>
        </div>
      </AppLayout>
    )
  }

  if (store.error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Erro ao carregar contatos: {store.error}</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contatos</h1>
            <p className="text-muted-foreground">
              Gerencie seus contatos e relacionamentos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCreateContact}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <QuickSearch
                  contacts={filteredContacts.map(contact => ({
                    id: contact.id,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email || '',
                    company: contact.company || null,
                    city: contact.city || null,
                    tags: contact.tags?.join(', ') || null
                  }))}
                  onSearch={(query) => {
                    store.setFilters({ search: query })
                    setLocalFilters(prev => ({ ...prev, search: query }))
                  }}
                />
              </div>
              <AdvancedFilters
                filters={localFilters}
                onFiltersChange={(newFilters) => {
                  store.setFilters(newFilters)
                  setLocalFilters(prev => ({ ...prev, ...newFilters }))
                }}
                onClearFilters={() => {
                  const emptyFilters = {
                    search: '',
                    status: undefined as string | undefined,
                    company: undefined as string | undefined,
                    city: undefined as string | undefined,
                    tags: [] as string[]
                  }
                  store.setFilters(emptyFilters)
                  setLocalFilters(emptyFilters)
                }}
                companies={uniqueCompanies as string[]}
                cities={uniqueCities as string[]}
                tags={[]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contatos */}
        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum contato encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece adicionando seu primeiro contato
                </p>
                <Button onClick={handleCreateContact}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Contato
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={contact.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                   contact.status === 'INACTIVE' ? 'bg-red-100 text-red-800' :
                                   contact.status === 'PROSPECT' ? 'bg-blue-100 text-blue-800' :
                                   contact.status === 'CUSTOMER' ? 'bg-purple-100 text-purple-800' :
                                   'bg-gray-100 text-gray-800'}
                        >
                          {contact.status === 'ACTIVE' ? 'Ativo' :
                           contact.status === 'INACTIVE' ? 'Inativo' :
                           contact.status === 'PROSPECT' ? 'Prospecto' :
                           contact.status === 'CUSTOMER' ? 'Cliente' :
                           contact.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        
                        {contact.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        
                        {contact.company && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{contact.company}</span>
                          </div>
                        )}
                        
                        {contact.city && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{contact.city}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(contact.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        {contact.tags && (
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4" />
                            <span>{contact.tags}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewContact(contact.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Paginação */}
        {store.pagination && store.pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((store.pagination.page - 1) * store.pagination.limit) + 1} a{' '}
              {Math.min(store.pagination.page * store.pagination.limit, store.pagination.total)} de{' '}
              {store.pagination.total} contatos
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => store.fetchContacts({}, store.pagination.page - 1)}
                disabled={store.pagination.page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => store.fetchContacts({}, store.pagination.page + 1)}
                disabled={store.pagination.page >= store.pagination.pages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}