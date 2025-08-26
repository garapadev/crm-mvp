import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { syncAccountEmails } from '@/lib/email-service'

// Schema de validação para sincronização
const syncSchema = z.object({
  folder: z.string().default('INBOX'),
})

// POST /api/email-accounts/[id]/sync - Sincronizar emails da conta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta de email é obrigatório' },
        { status: 400 }
      )
    }

    const { folder } = syncSchema.parse(body)

    // Sincronizar emails
    const syncedCount = await syncAccountEmails(id, folder)

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída. ${syncedCount} novos emails importados.`,
      syncedCount,
      folder
    })

  } catch (error) {
    console.error('Erro ao sincronizar emails:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    // Tratar erros específicos do serviço de email
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      if (error.message.includes('inativa')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      // Erros de conexão IMAP/SMTP
      if (error.message.includes('IMAP') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Erro de conexão com o servidor de email. Verifique as configurações da conta.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao sincronizar emails' },
      { status: 500 }
    )
  }
}