#!/usr/bin/env node

const { prisma } = require('../lib/prisma')
const Imap = require('node-imap')
const { simpleParser } = require('mailparser')

class EmailSyncWorker {
  constructor() {
    this.isRunning = false
    this.interval = null
    this.syncInterval = process.env.EMAIL_SYNC_INTERVAL || 300000 // 5 minutos (configurável)
    this.maxRetries = 3
    this.retryDelay = 5000 // 5 segundos
    this.connectionPool = new Map() // Pool de conexões IMAP
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
      const batchSize = process.env.EMAIL_SYNC_BATCH_SIZE || 3 // Máximo 3 contas simultâneas (configurável)
      for (let i = 0; i < emailAccounts.length; i += batchSize) {
        const batch = emailAccounts.slice(i, i + batchSize)
        const promises = batch.map(account => this.syncAccountWithRetry(account))
        const results = await Promise.allSettled(promises)
        
        // Log de resultados
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`❌ Falha na sincronização da conta ${batch[index].email}:`, result.reason)
          }
        })
      }

    } catch (error) {
      console.error('❌ Erro na sincronização geral:', error)
    }
  }

  async syncAccountWithRetry(emailAccount, retryCount = 0) {
    try {
      await this.syncAccount(emailAccount)
    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Tentativa ${retryCount + 1}/${this.maxRetries} para ${emailAccount.email}...`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.syncAccountWithRetry(emailAccount, retryCount + 1)
      } else {
        console.error(`❌ Falha definitiva na sincronização de ${emailAccount.email} após ${this.maxRetries} tentativas`)
        throw error
      }
    }
  }

  async syncAccount(emailAccount) {
    console.log(`📥 Sincronizando conta: ${emailAccount.email}`)
    
    return new Promise((resolve, reject) => {
      const imapConfig = {
        user: emailAccount.username,
        password: emailAccount.password,
        host: emailAccount.imapHost,
        port: emailAccount.imapPort,
        tls: emailAccount.imapSecure,
        connTimeout: 30000, // Reduzido para 30s
        authTimeout: 15000, // Reduzido para 15s
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

          // Buscar emails dos últimos dias (configurável)
          const daysBack = process.env.EMAIL_SYNC_DAYS_BACK || 7
          const syncDate = new Date()
          syncDate.setDate(syncDate.getDate() - daysBack)
          
          // Otimizar critérios de busca
          const searchCriteria = [
            'UNSEEN', // Apenas não lidos para otimizar
            ['SINCE', syncDate]
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
        reject(new Error(`IMAP Error: ${err.message}`))
      })

      imap.once('end', () => {
        resolve()
      })

      // Timeout para conexão
      const connectionTimeout = setTimeout(() => {
        imap.end()
        reject(new Error(`Timeout na conexão IMAP para ${emailAccount.email}`))
      }, 45000) // 45 segundos

      imap.once('ready', () => {
        clearTimeout(connectionTimeout)
      })

      imap.connect()
    })
  }

  async saveEmail(emailAccount, parsed) {
    try {
      // Gerar messageId único
      const messageId = parsed.messageId || `${parsed.subject}-${parsed.date?.getTime()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Cache simples para evitar verificações desnecessárias
      const cacheKey = `${emailAccount.id}-${messageId}`
      if (this.processedEmails && this.processedEmails.has(cacheKey)) {
        return // Email já processado nesta sessão
      }
      
      // Verificar se email já existe (com timeout)
      const existingEmail = await Promise.race([
        prisma.email.findUnique({
          where: {
            messageId: messageId
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        )
      ])

      if (existingEmail) {
        // Adicionar ao cache
        if (!this.processedEmails) this.processedEmails = new Set()
        this.processedEmails.add(cacheKey)
        return // Email já existe
      }

      // Preparar dados do email com validação
      const emailData = {
        messageId: messageId,
        subject: (parsed.subject || 'Sem assunto').substring(0, 255), // Limitar tamanho
        fromAddress: (parsed.from?.value?.[0]?.address || '').substring(0, 255),
        fromName: parsed.from?.value?.[0]?.name?.substring(0, 255) || null,
        toAddresses: (parsed.to?.value?.map(addr => addr.address) || []).slice(0, 50), // Limitar quantidade
        ccAddresses: (parsed.cc?.value?.map(addr => addr.address) || []).slice(0, 50),
        bccAddresses: (parsed.bcc?.value?.map(addr => addr.address) || []).slice(0, 50),
        bodyText: parsed.text?.substring(0, 50000) || null, // Limitar tamanho do texto
        bodyHtml: parsed.html?.substring(0, 100000) || null, // Limitar tamanho do HTML
        isRead: false,
        isStarred: false,
        hasAttachments: (parsed.attachments && parsed.attachments.length > 0),
        receivedAt: parsed.date || new Date(),
        emailAccountId: emailAccount.id,
        folderId: null // TODO: Implementar mapeamento de pastas
      }

      // Salvar email
      const savedEmail = await prisma.email.create({
        data: emailData
      })

      // Salvar anexos se existirem (limitado para performance)
      if (parsed.attachments && parsed.attachments.length > 0) {
        const maxAttachments = 10 // Limitar número de anexos
        const maxAttachmentSize = 10 * 1024 * 1024 // 10MB por anexo
        
        const attachments = parsed.attachments
          .slice(0, maxAttachments)
          .filter(attachment => (attachment.size || 0) <= maxAttachmentSize)
          .map(attachment => ({
            emailId: savedEmail.id,
            filename: (attachment.filename || 'anexo').substring(0, 255),
            contentType: (attachment.contentType || 'application/octet-stream').substring(0, 100),
            size: attachment.size || 0,
            content: attachment.content || Buffer.alloc(0)
          }))

        if (attachments.length > 0) {
          await prisma.emailAttachment.createMany({
            data: attachments
          })
        }
      }
      
      // Adicionar ao cache de processados
      if (!this.processedEmails) this.processedEmails = new Set()
      this.processedEmails.add(cacheKey)

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
      console.log('🧹 Iniciando limpeza...')
      
      // Limpar cache de emails processados
      if (this.processedEmails && this.processedEmails.size > 10000) {
        console.log(`🗑️ Limpando cache de ${this.processedEmails.size} emails processados`)
        this.processedEmails.clear()
      }
      
      // Limpar pool de conexões
      if (this.connectionPool && this.connectionPool.size > 0) {
        console.log(`🔌 Limpando ${this.connectionPool.size} conexões do pool`)
        this.connectionPool.clear()
      }
      
      // Verificar emails antigos (configurável)
      const retentionDays = process.env.EMAIL_RETENTION_DAYS || 90
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - retentionDays)

      const oldEmailsCount = await prisma.email.count({
        where: {
          receivedAt: {
            lt: retentionDate
          }
        }
      })

      if (oldEmailsCount > 0) {
        console.log(`📊 Existem ${oldEmailsCount} emails com mais de ${retentionDays} dias`)
        
        // Se configurado para auto-limpeza
        if (process.env.EMAIL_AUTO_CLEANUP === 'true') {
          console.log(`🗑️ Removendo emails antigos...`)
          await prisma.email.deleteMany({
            where: {
              receivedAt: {
                lt: retentionDate
              }
            }
          })
          console.log(`✅ ${oldEmailsCount} emails antigos removidos`)
        }
      }
      
      // Forçar garbage collection se disponível
      if (global.gc) {
        global.gc()
        console.log('♻️ Garbage collection executado')
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