import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, any>
}

interface Webhook {
  id: string
  url: string
  secret?: string | null
  headers?: Record<string, string> | null
}

export class WebhookService {
  /**
   * Dispara webhooks para um evento específico
   */
  static async trigger(event: string, data: Record<string, any>) {
    try {
      // Buscar todos os webhooks ativos que estão configurados para este evento
      const webhooks = await prisma.webhook.findMany({
        where: {
          isActive: true,
          events: {
            has: event
          }
        }
      })

      if (webhooks.length === 0) {
        console.log(`Nenhum webhook configurado para o evento: ${event}`)
        return
      }

      // Preparar payload
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data
      }

      // Disparar webhooks em paralelo
      const promises = webhooks.map((webhook: Webhook) => 
        this.sendWebhook(webhook, payload)
      )

      await Promise.allSettled(promises)

    } catch (error) {
      console.error('Erro ao disparar webhooks:', error)
    }
  }

  /**
   * Envia um webhook individual
   */
  private static async sendWebhook(webhook: Webhook, payload: WebhookPayload) {
    const startTime = Date.now()
    let success = false
    let statusCode = 0
    let errorMessage = ''

    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Webhook/1.0',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...webhook.headers
      }

      // Adicionar assinatura HMAC se secret estiver configurado
      if (webhook.secret) {
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)
        headers['X-Webhook-Signature'] = signature
      }

      // Fazer requisição HTTP
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      })

      statusCode = response.status
      success = response.ok

      if (!response.ok) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error(`Erro ao enviar webhook para ${webhook.url}:`, error)
    }

    const duration = Date.now() - startTime

    // Atualizar estatísticas do webhook
    const updateData: any = {
      totalCalls: { increment: 1 },
      lastTriggeredAt: new Date()
    }

    if (success) {
      updateData.successfulCalls = { increment: 1 }
    } else {
      updateData.failedCalls = { increment: 1 }
    }

    // Executar atualizações em paralelo
    await Promise.all([
      // Atualizar estatísticas do webhook
      prisma.webhook.update({
        where: { id: webhook.id },
        data: updateData
      }),
      
      // Criar log do webhook
      prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: payload.event,
          url: webhook.url,
          payload: payload,
          statusCode,
          success,
          errorMessage: errorMessage || null,
          duration,
          triggeredAt: new Date()
        }
      })
    ])
  }

  /**
   * Gera assinatura HMAC SHA-256 para validação
   */
  private static generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    return `sha256=${hmac.digest('hex')}`
  }

  /**
   * Dispara webhook para criação de colaborador
   */
  static async triggerEmployeeCreated(employee: any) {
    await this.trigger('EMPLOYEE_CREATED', {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        isActive: employee.isActive,
        createdAt: employee.createdAt
      }
    })
  }

  /**
   * Dispara webhook para atualização de colaborador
   */
  static async triggerEmployeeUpdated(employee: any, changes: Record<string, any>) {
    await this.trigger('EMPLOYEE_UPDATED', {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        isActive: employee.isActive,
        updatedAt: employee.updatedAt
      },
      changes
    })
  }

  /**
   * Dispara webhook para exclusão de colaborador
   */
  static async triggerEmployeeDeleted(employeeId: string, employeeData: any) {
    await this.trigger('EMPLOYEE_DELETED', {
      employee: {
        id: employeeId,
        ...employeeData,
        deletedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Dispara webhook para criação de tarefa
   */
  static async triggerTaskCreated(task: any) {
    await this.trigger('TASK_CREATED', {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        createdAt: task.createdAt
      }
    })
  }

  /**
   * Dispara webhook para atualização de tarefa
   */
  static async triggerTaskUpdated(task: any, changes: Record<string, any>) {
    await this.trigger('TASK_UPDATED', {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        updatedAt: task.updatedAt
      },
      changes
    })
  }

  /**
   * Dispara webhook para exclusão de tarefa
   */
  static async triggerTaskDeleted(taskId: string, taskData: any) {
    await this.trigger('TASK_DELETED', {
      task: {
        id: taskId,
        ...taskData,
        deletedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Dispara webhook para email recebido
   */
  static async triggerEmailReceived(email: any) {
    await this.trigger('EMAIL_RECEIVED', {
      email: {
        id: email.id,
        messageId: email.messageId,
        subject: email.subject,
        fromAddress: email.fromAddress,
        fromName: email.fromName,
        toAddresses: email.toAddresses,
        receivedAt: email.receivedAt,
        emailAccountId: email.emailAccountId
      }
    })
  }

  /**
   * Dispara webhook para email enviado
   */
  static async triggerEmailSent(email: any) {
    await this.trigger('EMAIL_SENT', {
      email: {
        id: email.id,
        subject: email.subject,
        fromAddress: email.fromAddress,
        toAddresses: email.toAddresses,
        sentAt: new Date().toISOString(),
        emailAccountId: email.emailAccountId
      }
    })
  }
}