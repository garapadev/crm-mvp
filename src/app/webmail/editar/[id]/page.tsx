'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, TestTube, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

// Schema de validação para edição de conta de email
const editEmailAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  type: z.enum(['IMAP', 'POP3', 'EXCHANGE']).default('IMAP'),
  imapHost: z.string().min(1, 'Host IMAP é obrigatório'),
  imapPort: z.coerce.number().int().min(1).max(65535).default(993),
  imapSecure: z.boolean().default(true),
  smtpHost: z.string().min(1, 'Host SMTP é obrigatório'),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(true),
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type EditEmailAccountForm = z.infer<typeof editEmailAccountSchema>

interface EmailAccount {
  id: string
  name: string
  email: string
  type: 'IMAP' | 'POP3' | 'EXCHANGE'
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  isDefault: boolean
  isActive: boolean
  employee?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  folders?: Array<{
    id: string
    name: string
    path: string
    unreadCount: number
    totalCount: number
  }>
  _count?: {
    emails: number
    folders: number
  }
}

export default function EditarEmailPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: zodResolver(editEmailAccountSchema),
    defaultValues: {
      name: '',
      email: '',
      type: 'IMAP' as const,
      imapHost: '',
      imapPort: 993,
      imapSecure: true,
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: true,
      username: '',
      password: '',
      isDefault: false,
      isActive: true,
    },
  })

  // Carregar dados da conta de email
  useEffect(() => {
    const loadEmailAccount = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/email-accounts/${accountId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Conta de email não encontrada')
            router.push('/webmail')
            return
          }
          throw new Error('Erro ao carregar conta de email')
        }

        const account = await response.json()
        setEmailAccount(account)
        
        // Preencher o formulário com os dados existentes
        reset({
          name: account.name,
          email: account.email,
          type: account.type,
          imapHost: account.imapHost,
          imapPort: account.imapPort,
          imapSecure: account.imapSecure,
          smtpHost: account.smtpHost,
          smtpPort: account.smtpPort,
          smtpSecure: account.smtpSecure,
          username: account.username,
          password: '', // Não carregar senha por segurança
          isDefault: account.isDefault,
          isActive: account.isActive,
        })
      } catch (error) {
        console.error('Erro ao carregar conta de email:', error)
        toast.error('Erro ao carregar dados da conta de email')
        router.push('/webmail')
      } finally {
        setIsLoading(false)
      }
    }

    if (accountId) {
      loadEmailAccount()
    }
  }, [accountId, router, reset])

  const handleTestConnection = async () => {
    const formData = watch()
    
    try {
      setIsTesting(true)
      setTestResult(null)
      
      const response = await fetch('/api/email-accounts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const result = await response.json()
      
      setTestResult({
        success: response.ok,
        message: result.message || (response.ok ? 'Conexão testada com sucesso!' : 'Erro ao testar conexão'),
        details: debugMode ? result : undefined
      })
      
      if (response.ok) {
        toast.success('Conexão testada com sucesso!')
      } else {
        toast.error(result.message || 'Erro ao testar conexão')
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error)
      setTestResult({
        success: false,
        message: 'Erro ao testar conexão',
        details: debugMode ? error : undefined
      })
      toast.error('Erro ao testar conexão')
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof editEmailAccountSchema>) => {
    try {
      setIsSaving(true)
      
      // Se a senha estiver vazia, não incluir no update
      const updateData = { ...data }
      if (!updateData.password) {
        delete updateData.password
      }
      
      const response = await fetch(`/api/email-accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar conta de email')
      }
      
      toast.success('Conta de email atualizada com sucesso!')
      router.push('/webmail')
    } catch (error) {
      console.error('Erro ao atualizar conta de email:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar conta de email')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando dados da conta...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/webmail')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Conta de Email</h1>
          <p className="text-muted-foreground">
            Edite as configurações da conta: {emailAccount?.name}
          </p>
        </div>
      </div>

      {emailAccount && (
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Funcionário: {emailAccount.employee?.firstName} {emailAccount.employee?.lastName} ({emailAccount.employee?.email})
                <br />
                Emails: {emailAccount._count?.emails || 0} | Pastas: {emailAccount._count?.folders || 0}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure as informações básicas da conta de email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Conta Principal"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Endereço de Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={watch('isDefault')}
                  onCheckedChange={(checked) => setValue('isDefault', !!checked)}
                />
                <Label htmlFor="isDefault">Conta padrão</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', !!checked)}
                />
                <Label htmlFor="isActive">Conta ativa</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações IMAP */}
        <Card>
          <CardHeader>
            <CardTitle>Servidor IMAP (Recebimento)</CardTitle>
            <CardDescription>
              Configure o servidor para receber emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="imapHost">Servidor IMAP</Label>
                <Input
                  id="imapHost"
                  placeholder="imap.exemplo.com"
                  {...register('imapHost')}
                />
                {errors.imapHost && (
                  <p className="text-sm text-red-500">{errors.imapHost.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imapPort">Porta</Label>
                <Input
                  id="imapPort"
                  type="number"
                  placeholder="993"
                  {...register('imapPort')}
                />
                {errors.imapPort && (
                  <p className="text-sm text-red-500">{errors.imapPort.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="imapSecure"
                checked={watch('imapSecure')}
                onCheckedChange={(checked) => setValue('imapSecure', !!checked)}
              />
              <Label htmlFor="imapSecure">Usar SSL/TLS</Label>
            </div>
          </CardContent>
        </Card>

        {/* Configurações SMTP */}
        <Card>
          <CardHeader>
            <CardTitle>Servidor SMTP (Envio)</CardTitle>
            <CardDescription>
              Configure o servidor para enviar emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.exemplo.com"
                  {...register('smtpHost')}
                />
                {errors.smtpHost && (
                  <p className="text-sm text-red-500">{errors.smtpHost.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtpPort">Porta</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  {...register('smtpPort')}
                />
                {errors.smtpPort && (
                  <p className="text-sm text-red-500">{errors.smtpPort.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smtpSecure"
                checked={watch('smtpSecure')}
                onCheckedChange={(checked) => setValue('smtpSecure', !!checked)}
              />
              <Label htmlFor="smtpSecure">Usar SSL/TLS</Label>
            </div>
          </CardContent>
        </Card>

        {/* Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle>Autenticação</CardTitle>
            <CardDescription>
              Configure as credenciais de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  placeholder="usuario@exemplo.com"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Deixe em branco para manter a senha atual"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do Teste */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : 'border-red-500 bg-red-50 text-red-700'
          }`}>
            <div className="space-y-2">
              <p>
                {testResult.message}
              </p>
              {debugMode && testResult.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Detalhes técnicos</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Debug Mode */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="debugMode"
                checked={debugMode}
                onCheckedChange={(checked) => setDebugMode(!!checked)}
              />
              <Label htmlFor="debugMode">Modo debug (mostrar detalhes técnicos)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>
          </div>
          
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/webmail')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}