"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  Plus, 
  Search,
  RefreshCw,
  Settings,
  Inbox,
  Send,
  File,
  Trash2,
  Star,
  Archive,
  Reply,
  ReplyAll,
  Forward,
  Eye,
  EyeOff
} from "lucide-react"
import toast from "react-hot-toast"
import { EmailAccountsList } from "@/components/webmail/email-accounts-list"
import { EmailList } from "@/components/webmail/email-list"
import { EmailReader } from "@/components/webmail/email-reader"
import { EmailComposer } from "@/components/webmail/email-composer"
// Removido: import { EmailAccountDialog } from "@/components/webmail/email-account-dialog"

interface EmailAccount {
  id: string
  name: string
  email: string
  type: 'IMAP'
  isDefault: boolean
  isActive: boolean
  lastSyncAt?: string
  _count: {
    emails: number
    folders: number
  }
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface Email {
  id: string
  messageId: string
  subject: string
  fromAddress: string
  fromName?: string
  toAddresses: string[]
  ccAddresses: string[]
  bccAddresses: string[]
  bodyText?: string
  bodyHtml?: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  receivedAt: string
  emailAccount: {
    id: string
    name: string
    email: string
  }
  folder?: {
    id: string
    name: string
    path: string
  }
  attachments: Array<{
    id: string
    filename: string
    contentType: string
    size: number
  }>
  _count: {
    attachments: number
  }
}

export default function WebmailPage() {
  const router = useRouter()
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRead, setFilterRead] = useState<string>("")
  const [filterStarred, setFilterStarred] = useState<string>("")
  const [showComposer, setShowComposer] = useState(false)
  // Removido: const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox')

  // Estatísticas de emails
  const emailStats = {
    total: emails.length,
    unread: emails.filter(e => !e.isRead).length,
    starred: emails.filter(e => e.isStarred).length,
    withAttachments: emails.filter(e => e.hasAttachments).length
  }

  const fetchEmailAccounts = async () => {
    try {
      const response = await fetch('/api/email-accounts?limit=50')
      if (response.ok) {
        const data = await response.json()
        setEmailAccounts(data.emailAccounts || [])
        
        // Selecionar conta padrão ou primeira conta
        const defaultAccount = (data.emailAccounts || []).find((acc: EmailAccount) => acc.isDefault)
        const firstAccount = (data.emailAccounts || [])[0]
        setSelectedAccount(defaultAccount || firstAccount || null)
      } else {
        toast.error('Erro ao carregar contas de email')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async (accountId?: string) => {
    if (!accountId && !selectedAccount) return

    setEmailsLoading(true)
    try {
      const targetAccountId = accountId || selectedAccount?.id
      const params = new URLSearchParams({
        accountId: targetAccountId!,
        limit: '100',
        orderBy: 'receivedAt',
        orderDirection: 'desc'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (filterRead) params.append('isRead', filterRead)
      if (filterStarred) params.append('isStarred', filterStarred)

      const response = await fetch(`/api/emails?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
      } else {
        toast.error('Erro ao carregar emails')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setEmailsLoading(false)
    }
  }

  const handleSyncEmails = async () => {
    if (!selectedAccount) return

    setSyncing(true)
    try {
      const response = await fetch(`/api/email-accounts/${selectedAccount.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder: 'INBOX' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        fetchEmails()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao sincronizar emails')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setSyncing(false)
    }
  }

  // Removido: handleAccountCreate - agora usa página dedicada

  const handleEmailUpdate = async (emailId: string, updates: any) => {
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        fetchEmails()
        if (selectedEmail?.id === emailId) {
          const updatedEmail = await response.json()
          setSelectedEmail(updatedEmail)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar email')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEmailDelete = async (emailId: string) => {
    if (!confirm('Tem certeza que deseja excluir este email?')) {
      return
    }

    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Email excluído com sucesso!')
        fetchEmails()
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir email')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEmailSend = async (emailData: any) => {
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          accountId: selectedAccount?.id
        }),
      })

      if (response.ok) {
        toast.success('Email enviado com sucesso!')
        setShowComposer(false)
        fetchEmails()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar email')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  useEffect(() => {
    fetchEmailAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchEmails()
    }
  }, [selectedAccount, searchTerm, filterRead, filterStarred])

  // Filtrar emails com base na view atual
  const filteredEmails = emails.filter(email => {
    switch (currentView) {
      case 'inbox':
        return true // Todos os emails (por enquanto)
      case 'sent':
        return email.fromAddress === selectedAccount?.email
      case 'drafts':
        return false // TODO: Implementar rascunhos
      case 'trash':
        return false // TODO: Implementar lixeira
      default:
        return true
    }
  })

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webmail</h1>
            <p className="text-gray-600">Cliente de email integrado</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleSyncEmails}
              disabled={!selectedAccount || syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            
            <Button onClick={() => setShowComposer(true)} disabled={!selectedAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Email
            </Button>
            
            <Button variant="outline" onClick={() => router.push('/webmail/configurar')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Conta
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Carregando contas de email...</p>
          </div>
        ) : emailAccounts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <CardTitle>Nenhuma conta configurada</CardTitle>
                <CardDescription>
                  Configure sua primeira conta de email para começar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/webmail/configurar')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Conta de Email
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-gray-50 flex flex-col">
              {/* Contas de Email */}
              <EmailAccountsList
                accounts={emailAccounts}
                selectedAccount={selectedAccount}
                onAccountSelect={setSelectedAccount}
              />

              {/* Navegação */}
              <div className="p-4 border-t">
                <div className="space-y-1">
                  <Button
                    variant={currentView === 'inbox' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentView('inbox')}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    Caixa de Entrada
                    {emailStats.unread > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {emailStats.unread}
                      </Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={currentView === 'sent' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentView('sent')}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviados
                  </Button>
                  
                  <Button
                    variant={currentView === 'drafts' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentView('drafts')}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Rascunhos
                  </Button>
                  
                  <Button
                    variant={currentView === 'trash' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentView('trash')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Lixeira
                  </Button>
                </div>
              </div>

              {/* Estatísticas */}
              {selectedAccount && (
                <div className="p-4 border-t mt-auto">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{emailStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Não lidos:</span>
                      <span className="font-medium">{emailStats.unread}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Favoritos:</span>
                      <span>{emailStats.starred}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Emails */}
            <div className="w-96 border-r flex flex-col">
              {/* Filtros */}
              <div className="p-4 border-b space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterRead} onValueChange={setFilterRead}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="false">Não lidos</SelectItem>
                      <SelectItem value="true">Lidos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStarred} onValueChange={setFilterStarred}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Favoritos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="true">Favoritos</SelectItem>
                      <SelectItem value="false">Não favoritos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista */}
              <EmailList
                emails={filteredEmails}
                selectedEmail={selectedEmail}
                onEmailSelect={setSelectedEmail}
                onEmailUpdate={handleEmailUpdate}
                loading={emailsLoading}
              />
            </div>

            {/* Visualizador de Email */}
            <div className="flex-1 flex flex-col">
              {selectedEmail ? (
                <EmailReader
                  email={selectedEmail}
                  onEmailUpdate={handleEmailUpdate}
                  onEmailDelete={handleEmailDelete}
                  onReply={() => setShowComposer(true)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Selecione um email para visualizar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <EmailComposer
        open={showComposer}
        onOpenChange={setShowComposer}
        onSend={handleEmailSend}
        account={selectedAccount}
        replyTo={selectedEmail}
      />

      {/* Removido: Dialog de Conta - agora usa página dedicada */}
    </AppLayout>
  )
}