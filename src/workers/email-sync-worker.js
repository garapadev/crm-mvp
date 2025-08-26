#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const Imap = require('node-imap')
const { simpleParser } = require('mailparser')

const prisma = new PrismaClient()

class EmailSyncWorker {
  constructor() {
    this.isRunning = false
    this.interval = null
    this.syncInterval = 300000 // 5 minutos
  }

  start() {
    console.log('📧 Email Sync Worker iniciado')
    this.isRunning = true
    
    // Sincronização inicial
    this.syncAllAccounts()
    
    // Sincronização periódica
    this.interval = setInterval(() => {
      this.syncAllAccounts()
    }, this.syncInterval)
  }

  stop() {
    console.log('⏹️ Parando Email Sync Worker...')
    this.isRunning = false
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  async syncAllAccounts() {
    try {
      // Buscar todas as contas de email ativas
      const emailAccounts = await prisma.emailAccount.findMany({
        where: {
          isActive: true,
          type: 'IMAP' // Por enquanto, apenas IMAP
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      if (emailAccounts.length === 0) {
        console.log('📭 Nenhuma conta de email ativa encontrada')
        return
      }

      console.log(`📬 Sincronizando ${emailAccounts.length} contas de email...`)

      // Sincronizar contas em paralelo (mas limitado para não sobrecarregar)
      const batchSize = 3 // Máximo 3 contas simultâneas
      for (let i = 0; i < emailAccounts.length; i += batchSize) {
        const batch = emailAccounts.slice(i, i + batchSize)
        const promises = batch.map(account => this.syncAccount(account))
        await Promise.allSettled(promises)
      }

    } catch (error) {
      console.error('❌ Erro na sincronização geral:', error)
    }
  }

  async syncAccount(emailAccount) {
    console.log(`📥 Sincronizando conta: ${emailAccount.email}`)
    
    return new Promise((resolve) => {
      const imapConfig = {
        user: emailAccount.username,
        password: emailAccount.password,
        host: emailAccount.imapHost,
        port: emailAccount.imapPort,
        tls: emailAccount.imapSecure,
        connTimeout: 60000,
        authTimeout: 30000,
        keepalive: false
      }

      const imap = new Imap(imapConfig)
      let processed = 0

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            console.error(`❌ Erro ao abrir INBOX para ${emailAccount.email}:`, err.message)
            imap.end()
            return resolve()
          }

          // Buscar emails dos últimos 7 dias que ainda não foram sincronizados
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          
          const searchCriteria = [
            'UNSEEN', // Apenas não lidos para otimizar
            ['SINCE', sevenDaysAgo]
          ]

          imap.search(searchCriteria, (err, results) => {
            if (err) {
              console.error(`❌ Erro na busca para ${emailAccount.email}:`, err.message)
              imap.end()
              return resolve()
            }

            if (!results || results.length === 0) {
              console.log(`📭 Nenhum email novo para ${emailAccount.email}`)
              imap.end()
              return resolve()
            }

            console.log(`📮 Encontrados ${results.length} emails novos para ${emailAccount.email}`)

            const fetch = imap.fetch(results, {
              bodies: '',
              struct: true,
              markSeen: false
            })

            fetch.on('message', (msg, seqno) => {
              let emailBuffer = Buffer.alloc(0)

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  emailBuffer = Buffer.concat([emailBuffer, chunk])
                })
              })

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(emailBuffer)
                  await this.saveEmail(emailAccount, parsed)
                  processed++
                } catch (error) {
                  console.error(`❌ Erro ao processar email ${seqno}:`, error.message)
                }
              })
            })

            fetch.once('error', (err) => {
              console.error(`❌ Erro no fetch para ${emailAccount.email}:`, err.message)
            })

            fetch.once('end', () => {
              console.log(`✅ Processados ${processed} emails para ${emailAccount.email}`)
              imap.end()
            })
          })
        })
      })

      imap.once('error', (err) => {
        console.error(`❌ Erro IMAP para ${emailAccount.email}:`, err.message)
        resolve()
      })

      imap.once('end', () => {
        resolve()
      })

      imap.connect()
    })
  }

  async saveEmail(emailAccount, parsed) {
    try {
      // Verificar se email já existe
      const existingEmail = await prisma.email.findUnique({
        where: {
          emailAccountId_messageId: {
            emailAccountId: emailAccount.id,
            messageId: parsed.messageId || `${parsed.subject}-${parsed.date?.getTime()}`
          }
        }
      })

      if (existingEmail) {
        return // Email já existe
      }

      // Preparar dados do email
      const emailData = {
        messageId: parsed.messageId || `${parsed.subject}-${parsed.date?.getTime()}`,
        subject: parsed.subject || 'Sem assunto',
        fromAddress: parsed.from?.value?.[0]?.address || '',
        fromName: parsed.from?.value?.[0]?.name || null,
        toAddresses: parsed.to?.value?.map(addr => addr.address) || [],
        ccAddresses: parsed.cc?.value?.map(addr => addr.address) || [],
        bccAddresses: parsed.bcc?.value?.map(addr => addr.address) || [],
        bodyText: parsed.text || null,
        bodyHtml: parsed.html || null,
        isRead: false,
        isStarred: false,
        hasAttachments: (parsed.attachments && parsed.attachments.length > 0),
        receivedAt: parsed.date || new Date(),
        emailAccountId: emailAccount.id,
        folder: 'INBOX'
      }

      // Salvar email
      const savedEmail = await prisma.email.create({
        data: emailData
      })

      // Salvar anexos se existirem
      if (parsed.attachments && parsed.attachments.length > 0) {
        const attachments = parsed.attachments.map(attachment => ({
          emailId: savedEmail.id,
          filename: attachment.filename || 'anexo',
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.size || 0,
          content: attachment.content || Buffer.alloc(0)
        }))

        await prisma.emailAttachment.createMany({
          data: attachments
        })
      }

      console.log(`💾 Email salvo: ${parsed.subject} (${emailAccount.email})`)

      // Disparar webhook se configurado
      try {
        const { WebhookService } = require('../lib/webhook-service')
        await WebhookService.triggerEmailReceived(savedEmail)
      } catch (webhookError) {
        console.error('❌ Erro ao disparar webhook:', webhookError.message)
        // Não falhar a sincronização por erro no webhook
      }

    } catch (error) {
      console.error('❌ Erro ao salvar email:', error.message)
    }
  }

  async cleanup() {
    try {
      // Limpar emails antigos (mais de 90 dias) se necessário
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      // Por enquanto, apenas log - não excluir automaticamente
      const oldEmailsCount = await prisma.email.count({
        where: {
          receivedAt: {
            lt: ninetyDaysAgo
          }
        }
      })

      if (oldEmailsCount > 0) {
        console.log(`📊 Existem ${oldEmailsCount} emails com mais de 90 dias`)
      }

    } catch (error) {
      console.error('❌ Erro na limpeza:', error)
    }
  }
}

// Inicializar worker
const worker = new EmailSyncWorker()

// Limpeza diária
setInterval(() => {
  worker.cleanup()
}, 86400000) // 24 horas

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📝 Recebido SIGTERM, parando worker...')
  worker.stop()
  prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('📝 Recebido SIGINT, parando worker...')
  worker.stop()
  prisma.$disconnect()
  process.exit(0)
})

// Iniciar o worker
worker.start()

// Limpeza inicial
worker.cleanup()