import Imap from 'node-imap'
import * as nodemailer from 'nodemailer'
import { simpleParser } from 'mailparser'
import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

// Interface para configuração de conta de email
interface EmailAccountConfig {
  id: string
  name: string
  email: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
}

// Interface para email parseado
interface ParsedEmail {
  messageId: string
  subject: string
  from: { address: string; name?: string }
  to: Array<{ address: string; name?: string }>
  cc?: Array<{ address: string; name?: string }>
  bcc?: Array<{ address: string; name?: string }>
  date: Date
  textBody?: string
  htmlBody?: string
  attachments: Array<{
    filename: string
    contentType: string
    size: number
    content: Buffer
  }>
}

// Classe para gerenciar operações de email
export class EmailService {
  private account: EmailAccountConfig

  constructor(account: EmailAccountConfig) {
    this.account = account
  }

  // Conectar ao IMAP e buscar emails
  async syncEmails(folderName: string = 'INBOX', limit: number = 50): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      const imapConfig = {
        user: this.account.username,
        password: this.account.password,
        host: this.account.imapHost,
        port: this.account.imapPort,
        tls: this.account.imapSecure,
        connTimeout: 60000,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
      }

      const imap = new Imap(imapConfig)
      const emails: ParsedEmail[] = []

      imap.once('ready', () => {
        imap.openBox(folderName, false, (err, box) => {
          if (err) {
            reject(err)
            return
          }

          // Buscar os últimos emails
          const searchCriteria = ['ALL']
          const fetchOptions = {
            bodies: '',
            struct: true,
            markSeen: false
          }

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              reject(err)
              return
            }

            if (!results || results.length === 0) {
              resolve([])
              return
            }

            // Pegar apenas os últimos N emails
            const recentResults = results.slice(-limit)
            const fetch = imap.fetch(recentResults, fetchOptions)
            let emailCount = 0

            fetch.on('message', (msg, seqno) => {
              let buffer = ''
              let attributes: any = null

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8')
                })
              })

              msg.once('attributes', (attrs) => {
                attributes = attrs
              })

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer)
                  
                  const email: ParsedEmail = {
                    messageId: parsed.messageId || `${seqno}-${Date.now()}`,
                    subject: parsed.subject || 'Sem assunto',
                    from: {
                      address: (parsed.from as any)?.value?.[0]?.address || (parsed.from as any)?.value?.address || '',
                      name: (parsed.from as any)?.value?.[0]?.name || (parsed.from as any)?.value?.name
                    },
                    to: (parsed.to as any)?.value?.map ? 
                      (parsed.to as any).value.map((addr: any) => ({
                        address: addr.address,
                        name: addr.name
                      })) : 
                      (parsed.to as any)?.value ? [{
                        address: (parsed.to as any).value.address,
                        name: (parsed.to as any).value.name
                      }] : [],
                    cc: (parsed.cc as any)?.value?.map ? 
                      (parsed.cc as any).value.map((addr: any) => ({
                        address: addr.address,
                        name: addr.name
                      })) : 
                      (parsed.cc as any)?.value ? [{
                        address: (parsed.cc as any).value.address,
                        name: (parsed.cc as any).value.name
                      }] : undefined,
                    bcc: (parsed.bcc as any)?.value?.map ? 
                      (parsed.bcc as any).value.map((addr: any) => ({
                        address: addr.address,
                        name: addr.name
                      })) : 
                      (parsed.bcc as any)?.value ? [{
                        address: (parsed.bcc as any).value.address,
                        name: (parsed.bcc as any).value.name
                      }] : undefined,
                    date: parsed.date || new Date(),
                    textBody: parsed.text,
                    htmlBody: parsed.html ? parsed.html.toString() : undefined,
                    attachments: parsed.attachments?.map(att => ({
                      filename: att.filename || 'attachment',
                      contentType: att.contentType || 'application/octet-stream',
                      size: att.size || 0,
                      content: att.content
                    })) || []
                  }

                  emails.push(email)
                  emailCount++

                  if (emailCount === recentResults.length) {
                    imap.end()
                    resolve(emails)
                  }
                } catch (parseError) {
                  console.error('Erro ao parsear email:', parseError)
                  emailCount++
                  if (emailCount === recentResults.length) {
                    imap.end()
                    resolve(emails)
                  }
                }
              })
            })

            fetch.once('error', (err) => {
              reject(err)
            })

            fetch.once('end', () => {
              if (emailCount === 0) {
                imap.end()
                resolve(emails)
              }
            })
          })
        })
      })

      imap.once('error', (err) => {
        reject(err)
      })

      imap.once('end', () => {
        // Conexão encerrada
      })

      imap.connect()
    })
  }

  // Enviar email via SMTP
  async sendEmail(emailData: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    text?: string
    html?: string
    replyTo?: string
    attachments?: Array<{
      filename: string
      content: Buffer | string
      contentType?: string
    }>
  }): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.account.smtpHost,
      port: this.account.smtpPort,
      secure: this.account.smtpSecure,
      auth: {
        user: this.account.username,
        pass: this.account.password,
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    const mailOptions = {
      from: `"${this.account.name}" <${this.account.email}>`,
      to: emailData.to.join(', '),
      cc: emailData.cc?.join(', '),
      bcc: emailData.bcc?.join(', '),
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      replyTo: emailData.replyTo,
      attachments: emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }))
    }

    await transporter.sendMail(mailOptions)
  }

  // Buscar pastas/folders
  async getFolders(): Promise<Array<{ name: string; path: string; attributes: string[] }>> {
    return new Promise((resolve, reject) => {
      const imapConfig = {
        user: this.account.username,
        password: this.account.password,
        host: this.account.imapHost,
        port: this.account.imapPort,
        tls: this.account.imapSecure,
        connTimeout: 60000,
        authTimeout: 3000,
        tlsOptions: { rejectUnauthorized: false }
      }

      const imap = new Imap(imapConfig)

      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          if (err) {
            reject(err)
            return
          }

          const folders: Array<{ name: string; path: string; attributes: string[] }> = []
          
          const processBox = (box: any, path: string = '') => {
            const currentPath = path ? `${path}/${box.name || 'Unknown'}` : (box.name || 'Unknown')
            
            folders.push({
              name: box.name || 'Unknown',
              path: currentPath,
              attributes: box.attribs || []
            })

            if (box.children) {
              Object.keys(box.children).forEach(childName => {
                processBox(box.children[childName], currentPath)
              })
            }
          }

          Object.keys(boxes).forEach(boxName => {
            processBox(boxes[boxName])
          })

          imap.end()
          resolve(folders)
        })
      })

      imap.once('error', (err) => {
        reject(err)
      })

      imap.connect()
    })
  }
}

// Função utilitária para criar instância do serviço
export async function createEmailService(accountId: string): Promise<EmailService> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId }
  })

  if (!account) {
    throw new Error('Conta de email não encontrada')
  }

  if (!account.isActive) {
    throw new Error('Conta de email está inativa')
  }

  return new EmailService({
    id: account.id,
    name: account.name,
    email: account.email,
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    imapSecure: account.imapSecure,
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpSecure: account.smtpSecure,
    username: account.username,
    password: account.password,
  })
}

// Função para sincronizar emails de uma conta
export async function syncAccountEmails(accountId: string, folderName: string = 'INBOX'): Promise<number> {
  try {
    const emailService = await createEmailService(accountId)
    const emails = await emailService.syncEmails(folderName, 20) // Sincronizar apenas 20 emails por vez

    let savedCount = 0

    for (const email of emails) {
      try {
        // Verificar se o email já existe
        const existingEmail = await prisma.email.findUnique({
          where: { messageId: email.messageId }
        })

        if (!existingEmail) {
          // Salvar novo email
          await prisma.email.create({
            data: {
              messageId: email.messageId,
              subject: email.subject,
              fromAddress: email.from.address,
              fromName: email.from.name || null,
              toAddresses: email.to.map(addr => addr.address),
              ccAddresses: email.cc?.map(addr => addr.address) || [],
              bccAddresses: email.bcc?.map(addr => addr.address) || [],
              bodyText: email.textBody || null,
              bodyHtml: email.htmlBody || null,
              hasAttachments: email.attachments.length > 0,
              receivedAt: email.date,
              emailAccountId: accountId,
              // TODO: Associar à pasta correta
            }
          })

          // TODO: Salvar anexos se houver
          
          savedCount++
        }
      } catch (error) {
        console.error(`Erro ao salvar email ${email.messageId}:`, error)
      }
    }

    return savedCount
  } catch (error) {
    console.error(`Erro ao sincronizar emails da conta ${accountId}:`, error)
    throw error
  }
}