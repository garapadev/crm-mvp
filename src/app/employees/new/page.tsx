"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface Group {
  id: string
  name: string
  level: number
}

interface PermissionGroup {
  id: string
  name: string
}

const employeeSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  groupId: z.string().optional(),
  permissionGroupId: z.string().optional(),
  createUser: z.boolean().optional(),
  userPassword: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

export default function NewEmployeePage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema)
  })

  const watchCreateUser = watch("createUser", false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsResponse, permissionGroupsResponse] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/permission-groups')
        ])

        if (groupsResponse.ok && permissionGroupsResponse.ok) {
          const [groupsData, permissionGroupsData] = await Promise.all([
            groupsResponse.json(),
            permissionGroupsResponse.json()
          ])
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

    fetchData()
  }, [])

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Colaborador criado com sucesso!')
        router.push('/employees')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar colaborador')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleCancel = () => {
    router.push('/employees')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <span>Carregando...</span>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
            <p className="text-muted-foreground">
              Adicione um novo colaborador ao sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Colaborador</CardTitle>
            <CardDescription>
              Preencha as informações do novo colaborador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Básicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      placeholder="Nome do colaborador"
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      placeholder="Sobrenome do colaborador"
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      {...register('birthDate')}
                    />
                  </div>
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Profissionais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      {...register('position')}
                      placeholder="Desenvolvedor, Gerente, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      {...register('department')}
                      placeholder="TI, RH, Vendas, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Data de Contratação</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      {...register('hireDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">Salário</Label>
                    <Input
                      id="salary"
                      type="number"
                      step="0.01"
                      {...register('salary', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Grupos e Permissões */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Grupos e Permissões</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupId">Grupo</Label>
                    <Select onValueChange={(value) => setValue('groupId', value === '__none__' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {groups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {'  '.repeat(group.level)}{group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permissionGroupId">Grupo de Permissão</Label>
                    <Select onValueChange={(value) => setValue('permissionGroupId', value === '__none__' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um grupo de permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {permissionGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Endereço</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Digite o endereço"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Digite a cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="Digite o estado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      placeholder="Digite o CEP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="Digite o país"
                  />
                </div>
              </div>

              {/* Contato de Emergência */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contato de Emergência</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Nome do Contato</Label>
                    <Input
                      id="emergencyContact"
                      {...register('emergencyContact')}
                      placeholder="Nome do contato de emergência"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                    <Input
                      id="emergencyPhone"
                      {...register('emergencyPhone')}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Acesso ao Sistema */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Acesso ao Sistema</h3>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="createUser"
                    checked={watchCreateUser}
                    onCheckedChange={(checked) => setValue('createUser', checked as boolean)}
                  />
                  <Label htmlFor="createUser">Criar usuário de acesso ao sistema</Label>
                </div>

                {watchCreateUser && (
                  <div className="space-y-2">
                    <Label htmlFor="userPassword">Senha</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      {...register('userPassword')}
                      placeholder="Digite a senha"
                    />
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Observações</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Digite observações sobre o colaborador"
                    rows={4}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Colaborador'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}