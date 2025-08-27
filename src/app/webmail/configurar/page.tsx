"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
// Removido: import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Mail,
  Server,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  TestTube,
  Bug,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import toast from "react-hot-toast"

const emailAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  imapHost: z.string().min(1, "Host IMAP é obrigatório"),
  imapPort: z.coerce.number().int().min(1).max(65535).default(993),
  imapSecure: z.boolean().default(true),
  smtpHost: z.string().min(1, "Host SMTP é obrigatório"),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(true),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  isDefault: z.boolean().default(false),
})

type EmailAccountFormData = z.infer<typeof emailAccountSchema>

// Configurações padrão para IMAP
const DEFAULT_IMAP_CONFIG = {
  imapPort: 993,
  imapSecure: true,
  smtpPort: 587,
  smtpSecure: false, // Porta 587 geralmente usa STARTTLS
}

export default function ConfigurarEmailPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [showDebugDetails, setShowDebugDetails] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EmailAccountFormData>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {
      ...DEFAULT_IMAP_CONFIG,
      isDefault: false
    }
  })

  const watchedValues = watch()

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setShowDebugDetails(false)

    try {
      const formData = watchedValues
      const requestData = {
        type: 'IMAP',
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        imapSecure: formData.imapSecure,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpSecure: formData.smtpSecure,
        username: formData.username,
        password: formData.password,
      }

      const response = await fetch('/api/email-accounts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()
      
      if (response.ok) {
        setTestResult({ 
          success: true, 
          message: result.message || 'Conexão testada com sucesso!',
          details: debugMode ? {
            request: requestData,
            response: result,
            status: response.status,
            timestamp: new Date().toISOString()
          } : undefined
        })
        toast.success('Conexão testada com sucesso!')
      } else {
        setTestResult({ 
          success: false, 
          message: result.error || 'Erro ao testar conexão',
          details: debugMode ? {
            request: requestData,
            response: result,
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            errorDetails: result.details || result.stack || 'Nenhum detalhe adicional disponível'
          } : undefined
        })
        toast.error(result.error || 'Erro ao testar conexão')
      }
    } catch (error) {
      const message = 'Erro ao conectar com o servidor'
      setTestResult({ 
        success: false, 
        message,
        details: debugMode ? {
          request: {
            type: 'IMAP',
            imapHost: watchedValues.imapHost,
            imapPort: watchedValues.imapPort,
            imapSecure: watchedValues.imapSecure,
            smtpHost: watchedValues.smtpHost,
            smtpPort: watchedValues.smtpPort,
            smtpSecure: watchedValues.smtpSecure,
            username: watchedValues.username,
            password: '***'
          },
          error: {
            name: error instanceof Error ? error.name : 'Unknown Error',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          },
          timestamp: new Date().toISOString()
        } : undefined
      })
      toast.error(message)
    } finally {
      setIsTesting(false)
    }
  }

  const onSubmit = async (data: EmailAccountFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: 'IMAP' // Sempre IMAP
        }),
      })

      if (response.ok) {
        toast.success('Conta de email configurada com sucesso!')
        router.push('/webmail')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao configurar conta de email')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/webmail')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurar Conta de Email</h1>
            <p className="text-gray-600">Configure uma nova conta IMAP para o webmail</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas da conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Conta</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Minha Conta Gmail"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Endereço de Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>



                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={watchedValues.isDefault}
                    onCheckedChange={(checked) => setValue('isDefault', !!checked)}
                  />
                  <Label htmlFor="isDefault">Definir como conta padrão</Label>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Configurações IMAP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Servidor IMAP (Recebimento)
              </CardTitle>
              <CardDescription>
                Configure o servidor para recebimento de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="imapHost">Servidor IMAP</Label>
                  <Input
                    id="imapHost"
                    placeholder="imap.gmail.com"
                    {...register('imapHost')}
                  />
                  {errors.imapHost && (
                    <p className="text-sm text-red-600 mt-1">{errors.imapHost.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="imapPort">Porta</Label>
                  <Input
                    id="imapPort"
                    type="number"
                    placeholder="993"
                    {...register('imapPort', { valueAsNumber: true })}
                  />
                  {errors.imapPort && (
                    <p className="text-sm text-red-600 mt-1">{errors.imapPort.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="imapSecure"
                  checked={watchedValues.imapSecure}
                  onCheckedChange={(checked) => setValue('imapSecure', !!checked)}
                />
                <Label htmlFor="imapSecure">Usar SSL/TLS</Label>
              </div>
            </CardContent>
          </Card>

          {/* Configurações SMTP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Servidor SMTP (Envio)
              </CardTitle>
              <CardDescription>
                Configure o servidor para envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    {...register('smtpHost')}
                  />
                  {errors.smtpHost && (
                    <p className="text-sm text-red-600 mt-1">{errors.smtpHost.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="smtpPort">Porta</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    {...register('smtpPort', { valueAsNumber: true })}
                  />
                  {errors.smtpPort && (
                    <p className="text-sm text-red-600 mt-1">{errors.smtpPort.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smtpSecure"
                  checked={watchedValues.smtpSecure}
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
                Credenciais para acessar sua conta de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    placeholder="Geralmente o mesmo que o email"
                    {...register('username')}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha ou senha de app"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resultado do Teste */}
          {testResult && (
            <Card className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug Details */}
          {debugMode && testResult && testResult.details && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-orange-800">
                  <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    Detalhes de Debug
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebugDetails(!showDebugDetails)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    {showDebugDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {showDebugDetails ? 'Ocultar' : 'Mostrar'} Detalhes
                  </Button>
                </CardTitle>
              </CardHeader>
              {showDebugDetails && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-orange-800 mb-2">Timestamp:</h4>
                      <code className="text-xs bg-orange-100 p-2 rounded block">
                        {testResult.details.timestamp}
                      </code>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm text-orange-800 mb-2">Dados da Requisição:</h4>
                      <pre className="text-xs bg-orange-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(testResult.details.request, null, 2)}
                      </pre>
                    </div>
                    
                    {testResult.details.response && (
                      <div>
                        <h4 className="font-semibold text-sm text-orange-800 mb-2">Resposta do Servidor:</h4>
                        <pre className="text-xs bg-orange-100 p-3 rounded overflow-auto max-h-40">
                          {JSON.stringify(testResult.details.response, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {testResult.details.status && (
                      <div>
                        <h4 className="font-semibold text-sm text-orange-800 mb-2">Status HTTP:</h4>
                        <code className="text-xs bg-orange-100 p-2 rounded block">
                          {testResult.details.status} {testResult.details.statusText || ''}
                        </code>
                      </div>
                    )}
                    
                    {testResult.details.error && (
                      <div>
                        <h4 className="font-semibold text-sm text-red-800 mb-2">Detalhes do Erro:</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-xs">Nome:</span>
                            <code className="text-xs bg-red-100 p-1 rounded ml-2">
                              {testResult.details.error.name}
                            </code>
                          </div>
                          <div>
                            <span className="font-medium text-xs">Mensagem:</span>
                            <code className="text-xs bg-red-100 p-1 rounded ml-2">
                              {testResult.details.error.message}
                            </code>
                          </div>
                          {testResult.details.error.stack && (
                            <div>
                              <span className="font-medium text-xs">Stack Trace:</span>
                              <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                                {testResult.details.error.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {testResult.details.errorDetails && (
                      <div>
                        <h4 className="font-semibold text-sm text-red-800 mb-2">Detalhes Adicionais:</h4>
                        <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-40">
                          {typeof testResult.details.errorDetails === 'string' 
                            ? testResult.details.errorDetails 
                            : JSON.stringify(testResult.details.errorDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !watchedValues.imapHost || !watchedValues.username || !watchedValues.password}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                />
                <Label htmlFor="debug-mode" className="text-sm flex items-center gap-1">
                  <Bug className="h-4 w-4" />
                  Modo Debug
                </Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/webmail')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}