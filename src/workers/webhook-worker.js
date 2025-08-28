#!/usr/bin/env node

const { prisma } = require('../lib/prisma')
const fetch = require('node-fetch')
const crypto = require('crypto')

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
      // Buscar webhook deliveries pendentes (não entregues)
      const pendingDeliveries = await prisma.webhookDelivery.findMany({
        where: {
          success: false,
          attempts: {
            lt: 3 // Máximo 3 tentativas
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
          }
        },
        include: {
          webhook: true
        },
        take: 10, // Processar 10 por vez
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (pendingDeliveries.length === 0) {
        return
      }

      console.log(`📝 Processando ${pendingDeliveries.length} webhook deliveries pendentes...`)

      // Processar deliveries em paralelo
      const promises = pendingDeliveries.map(delivery => 
        this.processWebhookDelivery(delivery)
      )

      await Promise.allSettled(promises)

    } catch (error) {
      console.error('❌ Erro ao processar fila de webhooks:', error)
    }
  }

  async processWebhookDelivery(delivery) {
    const startTime = Date.now()
    let success = false
    let statusCode = 0
    let errorMessage = ''

    try {
      const webhook = delivery.webhook

      if (!webhook || !webhook.isActive) {
        console.log(`⚠️ Webhook ${webhook?.id || 'unknown'} está inativo, pulando delivery ${delivery.id}`)
        return
      }

      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Webhook-Worker/1.0',
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Timestamp': delivery.createdAt.toISOString(),
        'X-Webhook-Delivery-Id': delivery.id
      }

      // Adicionar assinatura HMAC se secret estiver configurado
      if (webhook.secret) {
        const signature = this.generateSignature(
          JSON.stringify(delivery.payload), 
          webhook.secret
        )
        headers['X-Webhook-Signature'] = signature
      }

      // Fazer requisição HTTP
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        timeout: 30000 // 30 segundos
      })

      statusCode = response.status
      success = response.ok
      const responseText = await response.text()

      if (!response.ok) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      // Atualizar delivery com resultado
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          success,
          statusCode,
          response: responseText,
          attempts: { increment: 1 },
          deliveredAt: success ? new Date() : null
        }
      })

      console.log(`${success ? '✅' : '❌'} Webhook delivery ${delivery.id} - ${webhook.url} - ${statusCode}`)

    } catch (error) {
      errorMessage = error.message || 'Erro desconhecido'
      console.error(`❌ Erro ao processar webhook delivery ${delivery.id}:`, error)

      // Atualizar delivery com erro
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          success: false,
          response: errorMessage,
          attempts: { increment: 1 }
        }
      })
    }

    const duration = Date.now() - startTime

    // Atualizar timestamp do webhook
    if (success) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          lastTriggered: new Date()
        }
      })
    }

    console.log(`⏱️ Webhook delivery ${delivery.id} processado em ${duration}ms`)
  }

  generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return `sha256=${hmac.digest('hex')}`
  }

  async cleanup() {
    try {
      // Limpar deliveries antigas (mais de 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const deleted = await prisma.webhookDelivery.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          success: true // Só remove deliveries bem-sucedidas
        }
      })

      if (deleted.count > 0) {
        console.log(`🧹 Limpeza: ${deleted.count} webhook deliveries antigas removidas`)
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