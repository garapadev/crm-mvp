import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ContactStatus } from '@prisma/client'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  company?: string | null
  position?: string | null
  website?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  notes?: string | null
  tags: string[]
  status: ContactStatus
  source?: string | null
  latitude?: number | null
  longitude?: number | null
  customFields?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  // Relacionamentos opcionais
  leads?: Array<{
    id: string
    title: string
    status: string
    value?: number | null
    currency?: string | null
    createdAt: Date
  }>
  activities?: Array<{
    id: string
    type: string
    title: string
    description?: string | null
    createdAt: Date
    employee?: {
      id: string
      firstName: string
      lastName: string
    } | null
  }>
}

export interface ContactFilters {
  search?: string
  status?: ContactStatus
  company?: string
  tags?: string[]
  city?: string
  state?: string
  country?: string
}

export interface ContactPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface CreateContactData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  position?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  notes?: string
  tags?: string[]
  status?: ContactStatus
  source?: string
  latitude?: number
  longitude?: number
  customFields?: Record<string, any>
}

export interface UpdateContactData extends Partial<CreateContactData> {
  id: string
}

export interface NearbyContactsParams {
  lat: number
  lng: number
  radius?: number
  limit?: number
}

export interface NearbyContactsResult {
  contacts: (Contact & { distance: number })[]
  center: { lat: number; lng: number }
  radius: number
  total: number
}

interface ContactState {
  // Estado
  contacts: Contact[]
  selectedContact: Contact | null
  nearbyContacts: (Contact & { distance: number })[]
  filters: ContactFilters
  pagination: ContactPagination
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null

  // Ações
  setContacts: (contacts: Contact[]) => void
  setSelectedContact: (contact: Contact | null) => void
  setNearbyContacts: (contacts: (Contact & { distance: number })[]) => void
  setFilters: (filters: Partial<ContactFilters>) => void
  setPagination: (pagination: Partial<ContactPagination>) => void
  setLoading: (loading: boolean) => void
  setCreating: (creating: boolean) => void
  setUpdating: (updating: boolean) => void
  setDeleting: (deleting: boolean) => void
  setError: (error: string | null) => void

  // Operações CRUD
  fetchContacts: (filters?: ContactFilters, page?: number, limit?: number) => Promise<void>
  fetchContactById: (id: string) => Promise<Contact | null>
  createContact: (data: CreateContactData) => Promise<Contact | null>
  updateContact: (data: UpdateContactData) => Promise<Contact | null>
  deleteContact: (id: string) => Promise<boolean>
  fetchNearbyContacts: (params: NearbyContactsParams) => Promise<void>

  // Utilitários
  clearFilters: () => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  contacts: [],
  selectedContact: null,
  nearbyContacts: [],
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null
}

export const useContactStore = create<ContactState>()(devtools(
  (set, get) => ({
    ...initialState,

    // Setters
    setContacts: (contacts) => set({ contacts }),
    setSelectedContact: (contact) => set({ selectedContact: contact }),
    setNearbyContacts: (contacts) => set({ nearbyContacts: contacts }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
    setLoading: (loading) => set({ isLoading: loading }),
    setCreating: (creating) => set({ isCreating: creating }),
    setUpdating: (updating) => set({ isUpdating: updating }),
    setDeleting: (deleting) => set({ isDeleting: deleting }),
    setError: (error) => set({ error }),

    // Operações CRUD
    fetchContacts: async (filters = {}, page = 1, limit = 10) => {
      try {
        set({ isLoading: true, error: null })
        
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => 
              value !== undefined && value !== null && value !== ''
            ).map(([key, value]) => [
              key, 
              Array.isArray(value) ? value.join(',') : value.toString()
            ])
          )
        })

        const response = await fetch(`/api/contacts?${params}`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar contatos')
        }

        const data = await response.json()
        
        set({ 
          contacts: data.contacts,
          pagination: data.pagination,
          filters,
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isLoading: false 
        })
      }
    },

    fetchContactById: async (id: string) => {
      try {
        set({ isLoading: true, error: null })
        
        const response = await fetch(`/api/contacts/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Contato não encontrado')
          }
          throw new Error('Erro ao buscar contato')
        }

        const contact = await response.json()
        set({ selectedContact: contact, isLoading: false })
        
        return contact
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isLoading: false 
        })
        return null
      }
    },

    createContact: async (data: CreateContactData) => {
      try {
        set({ isCreating: true, error: null })
        
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao criar contato')
        }

        const contact = await response.json()
        
        // Atualizar lista de contatos
        const { contacts } = get()
        set({ 
          contacts: [contact, ...contacts],
          isCreating: false 
        })
        
        return contact
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isCreating: false 
        })
        return null
      }
    },

    updateContact: async (data: UpdateContactData) => {
      try {
        set({ isUpdating: true, error: null })
        
        const { id, ...updateData } = data
        
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao atualizar contato')
        }

        const updatedContact = await response.json()
        
        // Atualizar lista de contatos
        const { contacts, selectedContact } = get()
        const updatedContacts = contacts.map(contact => 
          contact.id === id ? updatedContact : contact
        )
        
        set({ 
          contacts: updatedContacts,
          selectedContact: selectedContact?.id === id ? updatedContact : selectedContact,
          isUpdating: false 
        })
        
        return updatedContact
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isUpdating: false 
        })
        return null
      }
    },

    deleteContact: async (id: string) => {
      try {
        set({ isDeleting: true, error: null })
        
        const response = await fetch(`/api/contacts/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao excluir contato')
        }
        
        // Remover da lista de contatos
        const { contacts, selectedContact } = get()
        const filteredContacts = contacts.filter(contact => contact.id !== id)
        
        set({ 
          contacts: filteredContacts,
          selectedContact: selectedContact?.id === id ? null : selectedContact,
          isDeleting: false 
        })
        
        return true
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isDeleting: false 
        })
        return false
      }
    },

    fetchNearbyContacts: async (params: NearbyContactsParams) => {
      try {
        set({ isLoading: true, error: null })
        
        const searchParams = new URLSearchParams({
          lat: params.lat.toString(),
          lng: params.lng.toString(),
          ...(params.radius && { radius: params.radius.toString() }),
          ...(params.limit && { limit: params.limit.toString() })
        })

        const response = await fetch(`/api/contacts/nearby?${searchParams}`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar contatos próximos')
        }

        const data: NearbyContactsResult = await response.json()
        
        set({ 
          nearbyContacts: data.contacts,
          isLoading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          isLoading: false 
        })
      }
    },

    // Utilitários
    clearFilters: () => set({ filters: {} }),
    clearError: () => set({ error: null }),
    reset: () => set(initialState)
  }),
  {
    name: 'contact-store'
  }
))

// Seletores úteis
export const useContactSelectors = () => {
  const store = useContactStore()
  
  return {
    // Contatos filtrados localmente (para busca rápida)
    filteredContacts: store.contacts.filter(contact => {
      const { search, status, company, tags } = store.filters
      
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          contact.firstName.toLowerCase().includes(searchLower) ||
          contact.lastName.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.company?.toLowerCase().includes(searchLower) ||
          contact.phone?.includes(search)
        
        if (!matchesSearch) return false
      }
      
      if (status && contact.status !== status) return false
      if (company && !contact.company?.toLowerCase().includes(company.toLowerCase())) return false
      if (tags && tags.length > 0 && !tags.some(tag => contact.tags.includes(tag))) return false
      
      return true
    }),
    
    // Estatísticas
    stats: {
      total: store.contacts.length,
      active: store.contacts.filter(c => c.status === 'ACTIVE').length,
      prospects: store.contacts.filter(c => c.status === 'PROSPECT').length,
      customers: store.contacts.filter(c => c.status === 'CUSTOMER').length,
      leads: store.contacts.filter(c => c.status === 'LEAD').length
    },
    
    // Tags únicas
    uniqueTags: Array.from(new Set(store.contacts.flatMap(c => c.tags))).sort(),
    
    // Empresas únicas
    uniqueCompanies: Array.from(new Set(
      store.contacts
        .map(c => c.company)
        .filter(Boolean)
    )).sort(),
    
    // Cidades únicas
    uniqueCities: Array.from(new Set(
      store.contacts
        .map(c => c.city)
        .filter(Boolean)
    )).sort()
  }
}