#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')
const crypto = require('crypto')

const prisma = new PrismaClient()

class WebhookWorker {
  constructor() {
    this.isRunning = false
    this.interval = null
    this.processInterval = 5000 // 5 segundos
  }

  start() {
    console.log('🚀 Webhook Worker iniciado')
    this.isRunning = true
    this.interval = setInterval(() => {
      this.processWebhookQueue()
    }, this.processInterval)
  }

  stop() {
    console.log('⏹️ Parando Webhook Worker...')
    this.isRunning = false
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  async processWebhookQueue() {
    try {
      // Buscar webhooks pendentes na fila
      const pendingWebhooks = await prisma.webhookQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          }
        },
        take: 10, // Processar 10 por vez
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (pendingWebhooks.length === 0) {
        return
      }

      console.log(`📝 Processando ${pendingWebhooks.length} webhooks pendentes...`)

      // Processar webhooks em paralelo
      const promises = pendingWebhooks.map(webhookItem => 
        this.processWebhookItem(webhookItem)
      )

      await Promise.allSettled(promises)

    } catch (error) {
      console.error('❌ Erro ao processar fila de webhooks:', error)
    }
  }

  async processWebhookItem(webhookItem) {
    const startTime = Date.now()
    let success = false
    let statusCode = 0
    let errorMessage = ''

    try {
      // Marcar como processando
      await prisma.webhookQueue.update({
        where: { id: webhookItem.id },
        data: { 
          status: 'PROCESSING',
          processedAt: new Date()
        }
      })

      // Buscar configurações do webhook
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookItem.webhookId }
      })

      if (!webhook || !webhook.isActive) {
        await prisma.webhookQueue.update({
          where: { id: webhookItem.id },
          data: { 
            status: 'CANCELLED',
            errorMessage: 'Webhook não encontrado ou inativo'
          }
        })
        return
      }

      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Webhook-Worker/1.0',
        'X-Webhook-Event': webhookItem.event,
        'X-Webhook-Timestamp': webhookItem.createdAt.toISOString(),
        ...webhook.headers
      }

      // Adicionar assinatura HMAC se secret estiver configurado
      if (webhook.secret) {
        const signature = this.generateSignature(
          JSON.stringify(webhookItem.payload), 
          webhook.secret
        )
        headers['X-Webhook-Signature'] = signature
      }

      // Fazer requisição HTTP
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookItem.payload),
        timeout: 30000 // 30 segundos
      })

      statusCode = response.status
      success = response.ok

      if (!response.ok) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      // Atualizar status do item da fila
      await prisma.webhookQueue.update({
        where: { id: webhookItem.id },
        data: {
          status: success ? 'COMPLETED' : 'FAILED',
          statusCode,
          errorMessage: errorMessage || null,
          completedAt: new Date()
        }
      })

    } catch (error) {
      errorMessage = error.message || 'Erro desconhecido'
      console.error(`❌ Erro ao processar webhook ${webhookItem.id}:`, error)

      // Marcar como falhado
      await prisma.webhookQueue.update({
        where: { id: webhookItem.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date()
        }
      })
    }

    const duration = Date.now() - startTime

    // Atualizar estatísticas do webhook
    const updateData = {
      totalCalls: { increment: 1 },
      lastTriggeredAt: new Date()
    }

    if (success) {
      updateData.successfulCalls = { increment: 1 }
    } else {
      updateData.failedCalls = { increment: 1 }
    }

    await prisma.webhook.update({
      where: { id: webhookItem.webhookId },
      data: updateData
    })

    // Criar log do webhook
    await prisma.webhookLog.create({
      data: {
        webhookId: webhookItem.webhookId,
        event: webhookItem.event,
        url: webhookItem.webhook?.url || '',
        payload: webhookItem.payload,
        statusCode,
        success,
        errorMessage: errorMessage || null,
        duration,
        triggeredAt: new Date()
      }
    })

    console.log(`${success ? '✅' : '❌'} Webhook ${webhookItem.id} processado: ${statusCode} (${duration}ms)`)
  }

  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return `sha256=${hmac.digest('hex')}`
  }

  async cleanup() {
    try {
      // Limpar itens antigos da fila (mais de 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const deleted = await prisma.webhookQueue.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo
          },
          status: {
            in: ['COMPLETED', 'FAILED', 'CANCELLED']
          }
        }
      })

      if (deleted.count > 0) {
        console.log(`🧹 Limpeza: ${deleted.count} itens removidos da fila`)
      }
    } catch (error) {
      console.error('❌ Erro na limpeza da fila:', error)
    }
  }
}

// Inicializar worker
const worker = new WebhookWorker()

// Limpeza a cada hora
setInterval(() => {
  worker.cleanup()
}, 3600000) // 1 hora

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