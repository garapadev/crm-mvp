"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  Filter, 
  X, 
  CalendarIcon, 
  Search,
  MapPin,
  Building2,
  Tag,
  Users,
  Calendar as CalendarLucide
} from "lucide-react"
import { ContactFilters } from "@/lib/stores/contactStore"

interface AdvancedFiltersProps {
  filters: ContactFilters
  onFiltersChange: (filters: ContactFilters) => void
  onClearFilters: () => void
  companies: string[]
  cities: string[]
  tags: string[]
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  companies,
  cities,
  tags
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<ContactFilters>(filters)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()

  const handleApplyFilters = () => {
    const updatedFilters = {
      ...localFilters,
      createdAfter: dateFrom?.toISOString(),
      createdBefore: dateTo?.toISOString()
    }
    onFiltersChange(updatedFilters)
    setIsOpen(false)
  }

  const handleClearAll = () => {
    setLocalFilters({})
    setDateFrom(undefined)
    setDateTo(undefined)
    onClearFilters()
    setIsOpen(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status) count++
    if (filters.company) count++
    if (filters.city) count++
    if (filters.tags) count++
    if (filters.hasLocation !== undefined) count++
    if (filters.createdAfter || filters.createdBefore) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </DialogTitle>
          <DialogDescription>
            Configure filtros detalhados para encontrar contatos específicos
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtros Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Busca e Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Busca Geral</Label>
                <Input
                  id="search"
                  placeholder="Nome, email, telefone..."
                  value={localFilters.search || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={localFilters.status || ''} 
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, status: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filtros de Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Select 
                  value={localFilters.city || ''} 
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, city: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as cidades</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasLocation"
                  checked={localFilters.hasLocation || false}
                  onCheckedChange={(checked) => 
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      hasLocation: checked ? true : undefined 
                    }))
                  }
                />
                <Label htmlFor="hasLocation">Apenas contatos com coordenadas GPS</Label>
              </div>
            </CardContent>
          </Card>

          {/* Filtros de Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa e Organização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company">Empresa</Label>
                <Select 
                  value={localFilters.company || ''} 
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, company: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as empresas</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filtros de Tags e Categorias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags e Categorias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Select 
                  value={localFilters.tags || ''} 
                  onValueChange={(value) => setLocalFilters(prev => ({ ...prev, tags: value || undefined }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as tags</SelectItem>
                    {tags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Filtros de Data */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarLucide className="h-4 w-4" />
                Período de Criação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filtros Ativos ({activeFiltersCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: {filters.search}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, search: undefined })}
                    />
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, status: undefined })}
                    />
                  </Badge>
                )}
                {filters.company && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Empresa: {filters.company}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, company: undefined })}
                    />
                  </Badge>
                )}
                {filters.city && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Cidade: {filters.city}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, city: undefined })}
                    />
                  </Badge>
                )}
                {filters.tags && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tag: {filters.tags}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, tags: undefined })}
                    />
                  </Badge>
                )}
                {filters.hasLocation && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Com localização
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ ...filters, hasLocation: undefined })}
                    />
                  </Badge>
                )}
                {(filters.createdAfter || filters.createdBefore) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Período personalizado
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onFiltersChange({ 
                        ...filters, 
                        createdAfter: undefined, 
                        createdBefore: undefined 
                      })}
                    />
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClearAll}>
            <X className="h-4 w-4 mr-2" />
            Limpar Todos
          </Button>
          
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}