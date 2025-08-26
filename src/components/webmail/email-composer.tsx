"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Send,
  Paperclip,
  X,
  Bold,
  Italic,
  Underline,
  List,
  Link
} from "lucide-react"

interface EmailAccount {
  id: string
  name: string
  email: string
  type: 'IMAP' | 'POP3' | 'EXCHANGE'
  isDefault: boolean
  isActive: boolean
}

interface Email {
  id: string
  subject: string
  fromAddress: string
  fromName?: string
  toAddresses: string[]
  ccAddresses: string[]
  bodyText?: string
  bodyHtml?: string
  receivedAt?: string
}

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (emailData: any) => Promise<void>
  account: EmailAccount | null
  replyTo?: Email | null
}

const emailSchema = z.object({
  to: z.string().min(1, "Destinatário é obrigatório"),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, "Assunto é obrigatório"),
  body: z.string().min(1, "Conteúdo é obrigatório"),
})

type EmailFormData = z.infer<typeof emailSchema>

export function EmailComposer({
  open,
  onOpenChange,
  onSend,
  account,
  replyTo
}: EmailComposerProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema)
  })

  // Configurar resposta se for reply
  useEffect(() => {
    if (open && replyTo) {
      const replySubject = replyTo.subject.startsWith('Re:') 
        ? replyTo.subject 
        : `Re: ${replyTo.subject}`
      
      setValue('to', replyTo.fromAddress)
      setValue('subject', replySubject)
      
      // Preparar conteúdo da resposta
      const originalContent = replyTo.bodyText || replyTo.bodyHtml?.replace(/<[^>]*>/g, '') || ''
      const replyContent = `\n\n---\nEm ${new Date(replyTo.receivedAt || '').toLocaleString('pt-BR')}, ${replyTo.fromName || replyTo.fromAddress} escreveu:\n${originalContent}`
      
      setValue('body', replyContent)
    } else if (open && !replyTo) {
      reset()
      setAttachments([])
      setShowCc(false)
      setShowBcc(false)
    }
  }, [open, replyTo, setValue, reset])

  const parseEmailAddresses = (addresses: string): string[] => {
    if (!addresses.trim()) return []
    return addresses
      .split(/[,;]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
  }

  const validateEmailAddresses = (addresses: string[]): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return addresses.every(addr => emailRegex.test(addr))
  }

  const onFormSubmit = async (data: EmailFormData) => {
    if (!account) {
      return
    }

    const toAddresses = parseEmailAddresses(data.to)
    const ccAddresses = parseEmailAddresses(data.cc || '')
    const bccAddresses = parseEmailAddresses(data.bcc || '')

    // Validar endereços de email
    const allAddresses = [...toAddresses, ...ccAddresses, ...bccAddresses]
    if (!validateEmailAddresses(allAddresses)) {
      alert('Por favor, verifique os endereços de email inseridos')
      return
    }

    try {
      const emailData = {
        to: toAddresses,
        cc: ccAddresses.length > 0 ? ccAddresses : undefined,
        bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
        subject: data.subject,
        text: isHtmlMode ? undefined : data.body,
        html: isHtmlMode ? data.body : undefined,
        // TODO: Implementar anexos
        attachments: attachments.map(file => ({
          filename: file.name,
          content: '', // TODO: Converter para base64
          contentType: file.type,
        }))
      }

      await onSend(emailData)
      reset()
      setAttachments([])
      setShowCc(false)
      setShowBcc(false)
    } catch (error) {
      console.error('Erro ao enviar email:', error)
    }
  }

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!account) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? 'Responder Email' : 'Novo Email'}
          </DialogTitle>
          <DialogDescription>
            Enviando de: {account.name} ({account.email})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 space-y-4">
          {/* Destinatários */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="to">Para *</Label>
              <Input
                {...register('to')}
                placeholder="destinatario@exemplo.com, outro@exemplo.com"
              />
              {errors.to && (
                <p className="text-sm text-red-600 mt-1">{errors.to.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!showCc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  CC
                </Button>
              )}
              {!showBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                >
                  CCO
                </Button>
              )}
            </div>

            {showCc && (
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  {...register('cc')}
                  placeholder="cc@exemplo.com"
                />
              </div>
            )}

            {showBcc && (
              <div>
                <Label htmlFor="bcc">CCO</Label>
                <Input
                  {...register('bcc')}
                  placeholder="cco@exemplo.com"
                />
              </div>
            )}
          </div>

          {/* Assunto */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              {...register('subject')}
              placeholder="Digite o assunto do email"
            />
            {errors.subject && (
              <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
            )}
          </div>

          {/* Anexos */}
          {attachments.length > 0 && (
            <div className="border rounded-lg p-3">
              <Label className="text-sm font-medium mb-2 block">Anexos</Label>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {file.type} • {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor de conteúdo */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="body">Mensagem *</Label>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHtmlMode(!isHtmlMode)}
                >
                  {isHtmlMode ? 'Texto' : 'HTML'}
                </Button>
              </div>
            </div>
            
            <Textarea
              {...register('body')}
              placeholder={isHtmlMode ? 'Digite o HTML do email...' : 'Digite sua mensagem...'}
              className="flex-1 min-h-[300px] resize-none"
            />
            {errors.body && (
              <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar
              </Button>
              
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileAttachment}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              <Button type="submit" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}