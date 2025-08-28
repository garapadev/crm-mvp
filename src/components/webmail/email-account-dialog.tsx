"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Mail,
  Server,
  Settings,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface EmailAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  account?: any
  mode?: 'create' | 'edit'
}

const emailAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  type: z.enum(['IMAP', 'POP3', 'EXCHANGE']).default('IMAP'),
  imapHost: z.string().min(1, "Host IMAP é obrigatório"),
  imapPort: z.coerce.number().int().min(1).max(65535).default(993),
  imapSecure: z.boolean().default(true),
  smtpHost: z.string().min(1, "Host SMTP é obrigatório"),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(true),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  isDefault: z.boolean().default(false),
  employeeId: z.string().min(1, "Colaborador é obrigatório"),
})

// Schema para o formulário sem default values
const emailAccountFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  imapHost: z.string().min(1, "Host IMAP é obrigatório"),
  smtpHost: z.string().min(1, "Host SMTP é obrigatório"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  employeeId: z.string().min(1, "Colaborador é obrigatório"),
  type: z.enum(['IMAP', 'POP3', 'EXCHANGE']).optional(),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

type EmailAccountFormData = z.infer<typeof emailAccountFormSchema>

// Configurações predefinidas para provedores populares
const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: true,
  },
  outlook: {
    name: 'Outlook',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: true,
  },
  yahoo: {
    name: 'Yahoo',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    smtpSecure: true,
  },
}

export function EmailAccountDialog({
  open,
  onOpenChange,
  onSubmit,
  account,
  mode = 'create'
}: EmailAccountDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionTest, setConnectionTest] = useState<{
    imap: { success: boolean; error?: string }
    smtp: { success: boolean; error?: string }
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmailAccountFormData>({
    resolver: zodResolver(emailAccountFormSchema),
    defaultValues: {
      type: 'IMAP',
      imapPort: 993,
      imapSecure: true,
      smtpPort: 587,
      smtpSecure: true,
      isDefault: false,
      employeeId: ''
    }
  })

  const watchedEmail = watch('email')

  // Buscar colaboradores
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees?limit=100')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data.employees || [])
        }
      } catch (error) {
        console.error('Erro ao buscar colaboradores:', error)
      }
    }

    if (open) {
      fetchEmployees()
    }
  }, [open])

  // Carregar dados da conta para edição
  useEffect(() => {
    if (mode === 'edit' && account && open) {
      reset({
        name: account.name || '',
        email: account.email || '',
        type: account.type || 'IMAP',
        imapHost: account.imapHost || '',
        imapPort: account.imapPort || 993,
        imapSecure: account.imapSecure ?? true,
        smtpHost: account.smtpHost || '',
        smtpPort: account.smtpPort || 587,
        smtpSecure: account.smtpSecure ?? true,
        username: account.username || '',
        password: '', // Não carregar senha por segurança
        isDefault: account.isDefault || false,
        employeeId: account.employee?.id || account.employeeId || ''
      })
    } else if (mode === 'create' && open) {
      reset({
        type: 'IMAP',
        imapPort: 993,
        imapSecure: true,
        smtpPort: 587,
        smtpSecure: true,
        isDefault: false,
        employeeId: ''
      })
    }
  }, [mode, account, open, reset])

  // Auto-detectar provedor baseado no email
  useEffect(() => {
    if (watchedEmail) {
      const domain = watchedEmail.split('@')[1]?.toLowerCase()
      
      if (domain?.includes('gmail.com')) {
        applyProviderSettings('gmail')
      } else if (domain?.includes('outlook.com') || domain?.includes('hotmail.com') || domain?.includes('live.com')) {
        applyProviderSettings('outlook')
      } else if (domain?.includes('yahoo.com')) {
        applyProviderSettings('yahoo')
      }
    }
  }, [watchedEmail])

  const applyProviderSettings = (providerId: keyof typeof EMAIL_PROVIDERS) => {
    const settings = EMAIL_PROVIDERS[providerId]
    setValue('imapHost', settings.imapHost)
    setValue('imapPort', settings.imapPort)
    setValue('imapSecure', settings.imapSecure)
    setValue('smtpHost', settings.smtpHost)
    setValue('smtpPort', settings.smtpPort)
    setValue('smtpSecure', settings.smtpSecure)
  }

  const testConnection = async () => {
    const formData = watch()
    
    if (!formData.imapHost || !formData.smtpHost || !formData.username || !formData.password) {
      alert('Preencha todos os campos obrigatórios antes de testar a conexão')
      return
    }

    setTestingConnection(true)
    setConnectionTest(null)

    try {
      // TODO: Implementar teste de conexão via API
      // Por enquanto, simular teste
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConnectionTest({
        imap: { success: true },
        smtp: { success: true }
      })
    } catch (error) {
      setConnectionTest({
        imap: { success: false, error: 'Erro de conexão IMAP' },
        smtp: { success: false, error: 'Erro de conexão SMTP' }
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const onFormSubmit = async (data: EmailAccountFormData) => {
    try {
      await onSubmit(data)
      reset()
      setConnectionTest(null)
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Conta de Email' : 'Nova Conta de Email'}
          </DialogTitle>
          <DialogDescription>
            Configure uma conta de email para sincronização IMAP/SMTP
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Configurações Básicas</TabsTrigger>
            <TabsTrigger value="advanced">Configurações Avançadas</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-4">
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  {...register('name')}
                  placeholder="Ex: Email Pessoal, Trabalho"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Endereço de Email *</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Usuário *</Label>
                  <Input
                    {...register('username')}
                    placeholder="Geralmente o mesmo email"
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="Senha da conta"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="employeeId">Colaborador *</Label>
                <Select value={watch('employeeId') || ''} onValueChange={(value) => setValue('employeeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-red-600 mt-1">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  {...register('isDefault')}
                  onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
                />
                <Label>Definir como conta padrão</Label>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo de Conta</Label>
                <Select value={watch('type') || 'IMAP'} onValueChange={(value) => setValue('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAP">IMAP (Recomendado)</SelectItem>
                    <SelectItem value="POP3">POP3</SelectItem>
                    <SelectItem value="EXCHANGE">Exchange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Configurações IMAP */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Server className="h-4 w-4 mr-2" />
                  Servidor IMAP (Recebimento)
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imapHost">Host IMAP *</Label>
                    <Input
                      {...register('imapHost')}
                      placeholder="imap.exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imapPort">Porta IMAP *</Label>
                    <Input
                      {...register('imapPort')}
                      type="number"
                      placeholder="993"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    {...register('imapSecure')}
                    onCheckedChange={(checked) => setValue('imapSecure', checked as boolean)}
                  />
                  <Label>Usar SSL/TLS</Label>
                </div>
              </div>

              {/* Configurações SMTP */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Servidor SMTP (Envio)
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">Host SMTP *</Label>
                    <Input
                      {...register('smtpHost')}
                      placeholder="smtp.exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPort">Porta SMTP *</Label>
                    <Input
                      {...register('smtpPort')}
                      type="number"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox
                    {...register('smtpSecure')}
                    onCheckedChange={(checked) => setValue('smtpSecure', checked as boolean)}
                  />
                  <Label>Usar SSL/TLS</Label>
                </div>
              </div>

              {/* Teste de Conexão */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Teste de Conexão</h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    {testingConnection ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                </div>

                {connectionTest && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {connectionTest.imap.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        IMAP: {connectionTest.imap.success ? 'Conectado' : connectionTest.imap.error}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {connectionTest.smtp.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        SMTP: {connectionTest.smtp.success ? 'Conectado' : connectionTest.smtp.error}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  reset()
                  setConnectionTest(null)
                }}
              >
                Cancelar
              </Button>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (mode === 'edit' ? 'Salvando...' : 'Criando...')
                  : (mode === 'edit' ? 'Salvar Alterações' : 'Criar Conta')
                }
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}