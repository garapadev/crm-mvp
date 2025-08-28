"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
  Calendar
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string | null
  department: string | null
  salary: number | null
  hireDate: string | null
  isActive: boolean
  user: {
    id: string
    name: string
    image: string | null
  } | null
  group: {
    id: string
    name: string
    path: string
  } | null
  permissionGroup: {
    id: string
    name: string
  } | null
}

interface Group {
  id: string
  name: string
  level: number
}

interface PermissionGroup {
  id: string
  name: string
}



export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGroup, setFilterGroup] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const router = useRouter()

  const fetchData = async () => {
    try {
      const [employeesResponse, groupsResponse, permissionGroupsResponse] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/groups'),
        fetch('/api/permission-groups')
      ])

      if (employeesResponse.ok && groupsResponse.ok && permissionGroupsResponse.ok) {
        const [employeesData, groupsData, permissionGroupsData] = await Promise.all([
          employeesResponse.json(),
          groupsResponse.json(),
          permissionGroupsResponse.json()
        ])
        setEmployees(employeesData.employees || employeesData)
        setGroups(groupsData)
        setPermissionGroups(permissionGroupsData)
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

  const handleCreate = () => {
    router.push('/employees/new')
  }

  const handleEdit = (employee: Employee) => {
    router.push(`/employees/${employee.id}/edit`)
  }

  const handleView = (employee: Employee) => {
    router.push(`/employees/${employee.id}`)
  }

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Tem certeza que deseja excluir o colaborador "${employee.firstName} ${employee.lastName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Colaborador excluído com sucesso!')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir colaborador')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGroup = !filterGroup || filterGroup === '__all__' || employee.group?.id === filterGroup

    const matchesStatus = !filterStatus || filterStatus === '__all__' || 
      (filterStatus === 'active' && employee.isActive) ||
      (filterStatus === 'inactive' && !employee.isActive)

    return matchesSearch && matchesGroup && matchesStatus
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Colaboradores</h1>
            <p className="text-gray-600">Gerencie os colaboradores da empresa</p>
          </div>
          
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Colaborador
          </Button>

        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar colaboradores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os grupos</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {'  '.repeat(group.level)}{group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Colaboradores */}
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando colaboradores...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {employees.length === 0 ? 'Nenhum colaborador encontrado' : 'Nenhum resultado para os filtros aplicados'}
              </h3>
              <p className="text-gray-600 mb-4">
                {employees.length === 0 
                  ? 'Comece adicionando seu primeiro colaborador'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {employees.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Colaborador
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(employee => (
              <Card key={employee.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {employee.firstName} {employee.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{employee.employeeNumber}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(employee)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {employee.position && (
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    )}
                    
                    {employee.department && (
                      <p className="text-sm text-gray-600">{employee.department}</p>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    
                    {employee.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{employee.phone}</span>
                      </div>
                    )}

                    {employee.hireDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Desde {new Date(employee.hireDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      <Badge 
                        variant={employee.isActive ? "default" : "secondary"}
                      >
                        {employee.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      
                      {employee.group && (
                        <Badge variant="outline" className="text-xs">
                          {employee.group.name}
                        </Badge>
                      )}
                      
                      {employee.permissionGroup && (
                        <Badge variant="outline" className="text-xs">
                          {employee.permissionGroup.name}
                        </Badge>
                      )}
                      
                      {employee.user && (
                        <Badge variant="secondary" className="text-xs">
                          Usuário do Sistema
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}