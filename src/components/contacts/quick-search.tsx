"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  User,
  Building2,
  MapPin,
  Tag
} from "lucide-react"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string | null
  city: string | null
  tags: string | null
}

interface SearchSuggestion {
  type: 'contact' | 'company' | 'city' | 'tag' | 'recent'
  value: string
  label: string
  icon: React.ReactNode
  contact?: Contact
}

interface QuickSearchProps {
  contacts: Contact[]
  onSearch: (query: string) => void
  onSelectContact?: (contact: Contact) => void
  placeholder?: string
  className?: string
}

export function QuickSearch({
  contacts,
  onSearch,
  onSelectContact,
  placeholder = "Buscar contatos...",
  className
}: QuickSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contact-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Erro ao carregar buscas recentes:', error)
      }
    }
  }, [])

  // Salvar buscas recentes no localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('contact-recent-searches', JSON.stringify(updated))
  }

  // Gerar sugestões baseadas na query
  useEffect(() => {
    if (!query.trim()) {
      // Mostrar buscas recentes quando não há query
      const recentSuggestions: SearchSuggestion[] = recentSearches.map(search => ({
        type: 'recent',
        value: search,
        label: search,
        icon: <Clock className="h-4 w-4" />
      }))
      setSuggestions(recentSuggestions)
      return
    }

    const queryLower = query.toLowerCase()
    const newSuggestions: SearchSuggestion[] = []

    // Sugestões de contatos
    const matchingContacts = contacts
      .filter(contact => 
        contact.firstName.toLowerCase().includes(queryLower) ||
        contact.lastName.toLowerCase().includes(queryLower) ||
        contact.email.toLowerCase().includes(queryLower)
      )
      .slice(0, 3)

    matchingContacts.forEach(contact => {
      newSuggestions.push({
        type: 'contact',
        value: `${contact.firstName} ${contact.lastName}`,
        label: `${contact.firstName} ${contact.lastName}`,
        icon: <User className="h-4 w-4" />,
        contact
      })
    })

    // Sugestões de empresas
    const companies = [...new Set(contacts
      .map(c => c.company)
      .filter(Boolean)
      .filter(company => company!.toLowerCase().includes(queryLower))
    )].slice(0, 3)

    companies.forEach(company => {
      newSuggestions.push({
        type: 'company',
        value: company!,
        label: company!,
        icon: <Building2 className="h-4 w-4" />
      })
    })

    // Sugestões de cidades
    const cities = [...new Set(contacts
      .map(c => c.city)
      .filter(Boolean)
      .filter(city => city!.toLowerCase().includes(queryLower))
    )].slice(0, 3)

    cities.forEach(city => {
      newSuggestions.push({
        type: 'city',
        value: city!,
        label: city!,
        icon: <MapPin className="h-4 w-4" />
      })
    })

    // Sugestões de tags
    const allTags = contacts
      .map(c => c.tags)
      .filter(Boolean)
      .flatMap(tags => tags!.split(',').map(tag => tag.trim()))
    
    const uniqueTags = [...new Set(allTags
      .filter(tag => tag.toLowerCase().includes(queryLower))
    )].slice(0, 3)

    uniqueTags.forEach(tag => {
      newSuggestions.push({
        type: 'tag',
        value: tag,
        label: tag,
        icon: <Tag className="h-4 w-4" />
      })
    })

    setSuggestions(newSuggestions)
    setSelectedIndex(-1)
  }, [query, contacts, recentSearches])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim())
      onSearch(searchQuery.trim())
      setIsOpen(false)
      setQuery('')
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'contact' && suggestion.contact && onSelectContact) {
      onSelectContact(suggestion.contact)
    } else {
      handleSearch(suggestion.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch(query)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('contact-recent-searches')
  }

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove)
    setRecentSearches(updated)
    localStorage.setItem('contact-recent-searches', JSON.stringify(updated))
  }

  // Scroll para o item selecionado
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay para permitir cliques nas sugestões
            setTimeout(() => setIsOpen(false), 200)
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (suggestions.length > 0 || (!query && recentSearches.length > 0)) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {!query && recentSearches.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Buscas Recentes
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={clearRecentSearches}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            )}

            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${suggestion.value}`}
                ref={el => suggestionRefs.current[index] = el}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                  selectedIndex === index 
                    ? "bg-blue-50 text-blue-700" 
                    : "hover:bg-gray-50"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className={cn(
                  "flex-shrink-0",
                  selectedIndex === index ? "text-blue-600" : "text-gray-400"
                )}>
                  {suggestion.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{suggestion.label}</div>
                  {suggestion.contact && (
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.contact.email}
                      {suggestion.contact.company && ` • ${suggestion.contact.company}`}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {suggestion.type === 'recent' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecentSearch(suggestion.value)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type === 'contact' ? 'Contato' :
                       suggestion.type === 'company' ? 'Empresa' :
                       suggestion.type === 'city' ? 'Cidade' : 'Tag'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {query && suggestions.length === 0 && (
              <div className="px-3 py-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma sugestão encontrada</p>
                <p className="text-xs text-gray-400 mt-1">
                  Pressione Enter para buscar por "{query}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}