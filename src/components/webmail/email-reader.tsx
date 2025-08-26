"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Reply,
  ReplyAll,
  Forward,
  Star,
  Trash2,
  MoreHorizontal,
  Paperclip,
  Download,
  Eye,
  EyeOff,
  Archive,
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

interface EmailReaderProps {
  email: Email
  onEmailUpdate: (emailId: string, updates: any) => Promise<void>
  onEmailDelete: (emailId: string) => Promise<void>
  onReply: () => void
}

export function EmailReader({
  email,
  onEmailUpdate,
  onEmailDelete,
  onReply
}: EmailReaderProps) {
  const [showRawHeaders, setShowRawHeaders] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleStarToggle = async () => {
    await onEmailUpdate(email.id, { isStarred: !email.isStarred })
  }

  const handleMarkAsUnread = async () => {
    await onEmailUpdate(email.id, { isRead: false })
  }

  const getEmailContent = () => {
    if (email.bodyHtml) {
      // Sanitizar HTML básico (em produção, usar uma biblioteca como DOMPurify)
      const sanitizedHtml = email.bodyHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )
    } else if (email.bodyText) {
      return (
        <div className="whitespace-pre-wrap font-mono text-sm">
          {email.bodyText}
        </div>
      )
    } else {
      return (
        <div className="text-gray-500 italic">
          Conteúdo do email não disponível
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header com ações */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReply}
            >
              <Reply className="h-4 w-4 mr-2" />
              Responder
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onReply}
            >
              <ReplyAll className="h-4 w-4 mr-2" />
              Resp. Todos
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onReply}
            >
              <Forward className="h-4 w-4 mr-2" />
              Encaminhar
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStarToggle}
              className={email.isStarred ? 'text-yellow-500' : ''}
            >
              <Star className={`h-4 w-4 ${email.isStarred ? 'fill-current' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAsUnread}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Marcar como não lido
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onEmailDelete(email.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Informações do email */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {email.subject || 'Sem assunto'}
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {email.fromName?.charAt(0)?.toUpperCase() || 
                   email.fromAddress.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              <div>
                <div className="font-medium">
                  {email.fromName || email.fromAddress}
                </div>
                <div className="text-sm text-gray-600">
                  {email.fromAddress}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {formatDate(email.receivedAt)}
            </div>
          </div>

          {/* Destinatários */}
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-600">Para: </span>
              <span>{email.toAddresses.join(', ')}</span>
            </div>
            
            {email.ccAddresses.length > 0 && (
              <div>
                <span className="text-gray-600">CC: </span>
                <span>{email.ccAddresses.join(', ')}</span>
              </div>
            )}
            
            {email.bccAddresses.length > 0 && (
              <div>
                <span className="text-gray-600">CCO: </span>
                <span>{email.bccAddresses.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Anexos */}
          {email.hasAttachments && email.attachments.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Paperclip className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">
                  {email.attachments.length} anexo{email.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {email.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{attachment.filename}</div>
                        <div className="text-xs text-gray-500">
                          {attachment.contentType} • {formatFileSize(attachment.size)}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo do email */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {getEmailContent()}
        </div>
      </ScrollArea>

      {/* Footer com metadata */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Via {email.emailAccount.name} ({email.emailAccount.email})
          </div>
          
          <div className="flex items-center space-x-4">
            {email.folder && (
              <Badge variant="outline" className="text-xs">
                {email.folder.name}
              </Badge>
            )}
            
            <div>ID: {email.messageId}</div>
          </div>
        </div>
      </div>
    </div>
  )
}