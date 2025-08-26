"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  MapPin, 
  Search, 
  Filter,
  Navigation,
  Building,
  Phone,
  Mail,
  Eye,
  Layers
} from "lucide-react"
import { useContactStore } from "@/lib/stores/contactStore"
import { useRouter } from "next/navigation"

interface Contact {
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
  latitude?: number
  longitude?: number
  createdAt: Date
  updatedAt: Date
}

interface MapFilters {
  search: string
  status: string
  city: string
  radius: number
}

interface MapMarker {
  id: string
  contact: Contact
  position: { lat: number; lng: number }
}

// Simulação de coordenadas para demonstração
const getCityCoordinates = (city: string): { lat: number; lng: number } | null => {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    'São Paulo': { lat: -23.5505, lng: -46.6333 },
    'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
    'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
    'Brasília': { lat: -15.7942, lng: -47.8822 },
    'Salvador': { lat: -12.9714, lng: -38.5014 },
    'Fortaleza': { lat: -3.7319, lng: -38.5267 },
    'Curitiba': { lat: -25.4284, lng: -49.2733 },
    'Recife': { lat: -8.0476, lng: -34.8770 },
    'Porto Alegre': { lat: -30.0346, lng: -51.2177 },
    'Manaus': { lat: -3.1190, lng: -60.0217 }
  }
  
  return cityCoords[city] || null
}

const getStatusColor = (status: Contact['status']) => {
  switch (status) {
    case 'active':
      return '#10b981' // green
    case 'inactive':
      return '#6b7280' // gray
    case 'prospect':
      return '#3b82f6' // blue
    case 'client':
      return '#8b5cf6' // purple
    default:
      return '#6b7280'
  }
}

const SimpleMap = ({ markers, selectedMarker, onMarkerClick, center, zoom }: {
  markers: MapMarker[]
  selectedMarker: MapMarker | null
  onMarkerClick: (marker: MapMarker) => void
  center: { lat: number; lng: number }
  zoom: number
}) => {
  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border">
      {/* Simulação de mapa usando SVG */}
      <svg width="100%" height="100%" viewBox="0 0 800 400" className="absolute inset-0">
        {/* Background do mapa */}
        <rect width="800" height="400" fill="#f3f4f6" />
        
        {/* Linhas de grade para simular um mapa */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Marcadores */}
        {markers.map((marker, index) => {
          const x = 100 + (index % 6) * 120 + Math.random() * 40
          const y = 80 + Math.floor(index / 6) * 80 + Math.random() * 40
          const isSelected = selectedMarker?.id === marker.id
          
          return (
            <g key={marker.id}>
              {/* Círculo de seleção */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )}
              
              {/* Marcador */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={getStatusColor(marker.contact.status)}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-10 transition-all"
                onClick={() => onMarkerClick(marker)}
              />
              
              {/* Tooltip no hover */}
              <title>{marker.contact.name} - {marker.contact.city}</title>
            </g>
          )
        })}
      </svg>
      
      {/* Controles do mapa */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button size="sm" variant="outline" className="bg-white">
          <Navigation className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-white">
          <Layers className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
        <h4 className="text-sm font-medium mb-2">Status dos Contatos</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Prospect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs">Cliente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs">Inativo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContactsMap() {
  const router = useRouter()
  const { contacts, getFilteredContacts, getUniqueCities } = useContactStore()
  const [filters, setFilters] = useState<MapFilters>({
    search: '',
    status: 'all',
    city: 'all',
    radius: 50
  })
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 }) // São Paulo
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  // Criar marcadores a partir dos contatos com localização
  const markers = useMemo(() => {
    const filteredContacts = getFilteredContacts({
      search: filters.search,
      status: filters.status === 'all' ? undefined : filters.status as Contact['status'],
      city: filters.city === 'all' ? undefined : filters.city
    })

    return filteredContacts
      .filter(contact => contact.city) // Apenas contatos com cidade
      .map(contact => {
        const coords = getCityCoordinates(contact.city!)
        if (!coords) return null
        
        // Adicionar pequena variação para evitar sobreposição
        const randomOffset = () => (Math.random() - 0.5) * 0.01
        
        return {
          id: contact.id,
          contact,
          position: {
            lat: coords.lat + randomOffset(),
            lng: coords.lng + randomOffset()
          }
        }
      })
      .filter(Boolean) as MapMarker[]
  }, [contacts, filters, getFilteredContacts])

  const cities = getUniqueCities()
  const contactsWithLocation = contacts.filter(c => c.city).length
  const totalContacts = contacts.length

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker)
  }

  const handleViewContact = (contactId: string) => {
    router.push(`/contacts/${contactId}`)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      city: 'all',
      radius: 50
    })
    setSelectedMarker(null)
  }

  return (
    <div className="space-y-6">
      {/* Header e Estatísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mapa de Contatos</h2>
          <p className="text-gray-600">
            {contactsWithLocation} de {totalContacts} contatos com localização
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtros do Mapa</DialogTitle>
                <DialogDescription>
                  Configure os filtros para visualizar contatos específicos no mapa.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="map-search">Buscar</Label>
                  <Input
                    id="map-search"
                    placeholder="Nome, empresa ou email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="map-status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="map-city">Cidade</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(value) => setFilters({ ...filters, city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar
                  </Button>
                  <Button onClick={() => setIsFilterDialogOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={clearFilters}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização dos Contatos
              </CardTitle>
              <CardDescription>
                {markers.length} contatos exibidos no mapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleMap
                markers={markers}
                selectedMarker={selectedMarker}
                onMarkerClick={handleMarkerClick}
                center={mapCenter}
                zoom={10}
              />
            </CardContent>
          </Card>
        </div>

        {/* Painel Lateral */}
        <div className="space-y-4">
          {/* Busca Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Busca Rápida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar no mapa..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato Selecionado */}
          {selectedMarker && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contato Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">{selectedMarker.contact.name}</h3>
                  {selectedMarker.contact.position && (
                    <p className="text-sm text-gray-600">{selectedMarker.contact.position}</p>
                  )}
                </div>
                
                {selectedMarker.contact.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedMarker.contact.company}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedMarker.contact.email}</span>
                </div>
                
                {selectedMarker.contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{selectedMarker.contact.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {[selectedMarker.contact.city, selectedMarker.contact.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                
                <Badge 
                  className={`${getStatusColor(selectedMarker.contact.status)} text-white`}
                  style={{ backgroundColor: getStatusColor(selectedMarker.contact.status) }}
                >
                  {selectedMarker.contact.status === 'active' ? 'Ativo' :
                   selectedMarker.contact.status === 'inactive' ? 'Inativo' :
                   selectedMarker.contact.status === 'prospect' ? 'Prospect' : 'Cliente'}
                </Badge>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleViewContact(selectedMarker.contact.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de Contatos Próximos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contatos na Região</CardTitle>
              <CardDescription>
                {markers.length} contatos encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {markers.slice(0, 10).map((marker) => (
                  <div
                    key={marker.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedMarker?.id === marker.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedMarker(marker)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{marker.contact.name}</p>
                        <p className="text-xs text-gray-600">{marker.contact.city}</p>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(marker.contact.status) }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {markers.length > 10 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{markers.length - 10} contatos adicionais
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}