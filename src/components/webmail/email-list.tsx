"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Mail,
  MailOpen,
  Star,
  Paperclip,
  Calendar,
  User
} from "lucide-react"

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

interface EmailListProps {
  emails: Email[]
  selectedEmail: Email | null
  onEmailSelect: (email: Email) => void
  onEmailUpdate: (emailId: string, updates: any) => Promise<void>
  loading?: boolean
}

export function EmailList({
  emails,
  selectedEmail,
  onEmailSelect,
  onEmailUpdate,
  loading = false
}: EmailListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getPreviewText = (email: Email) => {
    const text = email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '') || ''
    return truncateText(text.trim())
  }

  const handleStarToggle = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation()
    await onEmailUpdate(email.id, { isStarred: !email.isStarred })
  }

  const handleReadToggle = async (email: Email) => {
    if (!email.isRead) {
      await onEmailUpdate(email.id, { isRead: true })
    }
    onEmailSelect(email)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Carregando emails...</p>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum email encontrado</p>
          <p className="text-sm">Tente sincronizar ou ajustar os filtros</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedEmail?.id === email.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
            } ${!email.isRead ? 'bg-blue-50' : ''}`}
            onClick={() => handleReadToggle(email)}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar/Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {email.fromName?.charAt(0)?.toUpperCase() || 
                     email.fromAddress.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Email Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className={`truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                      {email.fromName || email.fromAddress}
                    </span>
                    {!email.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {email.hasAttachments && (
                      <Paperclip className="h-3 w-3 text-gray-400" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 ${email.isStarred ? 'text-yellow-500' : 'text-gray-400'}`}
                      onClick={(e) => handleStarToggle(email, e)}
                    >
                      <Star className={`h-3 w-3 ${email.isStarred ? 'fill-current' : ''}`} />
                    </Button>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(email.receivedAt)}
                    </span>
                  </div>
                </div>

                <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-medium' : ''}`}>
                  {email.subject || 'Sem assunto'}
                </div>

                <div className="text-xs text-gray-600 line-clamp-2">
                  {getPreviewText(email)}
                </div>

                {/* Tags/Badges */}
                <div className="flex items-center space-x-2 mt-2">
                  {email.folder && (
                    <Badge variant="outline" className="text-xs">
                      {email.folder.name}
                    </Badge>
                  )}
                  
                  {email.ccAddresses.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{email.ccAddresses.length} CC
                    </Badge>
                  )}
                  
                  {email._count.attachments > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {email._count.attachments} anexo{email._count.attachments > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}