"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Mail,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface EmailAccount {
  id: string
  name: string
  email: string
  type: 'IMAP' | 'POP3' | 'EXCHANGE'
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

interface EmailAccountsListProps {
  accounts: EmailAccount[]
  selectedAccount: EmailAccount | null
  onAccountSelect: (account: EmailAccount) => void
}

export function EmailAccountsList({
  accounts,
  selectedAccount,
  onAccountSelect
}: EmailAccountsListProps) {
  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Nunca sincronizado'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `${diffMins}min atrás`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d atrás`
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Contas de Email</h3>
        <p className="text-sm text-gray-600">{accounts.length} contas configuradas</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {accounts.map((account) => (
            <Button
              key={account.id}
              variant={selectedAccount?.id === account.id ? "secondary" : "ghost"}
              className="w-full p-3 h-auto flex flex-col items-start justify-start text-left"
              onClick={() => onAccountSelect(account)}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium truncate">{account.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {account.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {account.isActive ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 truncate w-full">
                {account.email}
              </div>
              
              <div className="flex items-center justify-between w-full mt-2 text-xs text-gray-500">
                <span>{account.type}</span>
                <Badge variant="secondary" className="text-xs">
                  {account._count.emails} emails
                </Badge>
              </div>
              
              {account.lastSyncAt && (
                <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastSync(account.lastSyncAt)}</span>
                </div>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}