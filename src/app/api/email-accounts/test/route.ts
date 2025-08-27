import { NextRequest, NextResponse } from 'next/server'
import Imap from 'node-imap'
import * as nodemailer from 'nodemailer'

// POST /api/email-accounts/test - Testar conexão de email antes de salvar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      username,
      password
    } = body

    // Validar campos obrigatórios
    if (!imapHost || !imapPort || !smtpHost || !smtpPort || !username || !password) {
      return NextResponse.json(
        { error: 'Todos os campos de conexão são obrigatórios' },
        { status: 400 }
      )
    }

    // Apenas suportar IMAP
    if (type !== 'IMAP') {
      return NextResponse.json(
        { error: 'Apenas conexões IMAP são suportadas' },
        { status: 400 }
      )
    }

    const testResults = {
      imap: { success: false, error: null as string | null },
      smtp: { success: false, error: null as string | null },
    }

    // Testar conexão IMAP
    try {
      await testImapConnection({
        imapHost,
        imapPort: parseInt(imapPort.toString()),
        imapSecure,
        username,
        password
      })
      testResults.imap.success = true
    } catch (error) {
      testResults.imap.error = error instanceof Error ? error.message : 'Erro desconhecido no IMAP'
    }

    // Testar conexão SMTP
    try {
      await testSmtpConnection({
        smtpHost,
        smtpPort: parseInt(smtpPort.toString()),
        smtpSecure,
        username,
        password
      })
      testResults.smtp.success = true
    } catch (error) {
      testResults.smtp.error = error instanceof Error ? error.message : 'Erro desconhecido no SMTP'
    }

    const overallSuccess = testResults.imap.success && testResults.smtp.success

    if (overallSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Conexão testada com sucesso! Configurações IMAP e SMTP estão funcionando.',
        details: testResults
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Falha ao testar uma ou mais conexões',
          details: testResults
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro ao testar conexão de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao testar conexão' },
      { status: 500 }
    )
  }
}

// Função para testar conexão IMAP
function testImapConnection(config: {
  imapHost: string
  imapPort: number
  imapSecure: boolean
  username: string
  password: string
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: config.username,
      password: config.password,
      host: config.imapHost,
      port: config.imapPort,
      tls: config.imapSecure,
      connTimeout: 15000, // 15 segundos
      authTimeout: 10000, // 10 segundos
      tlsOptions: { rejectUnauthorized: false }
    }

    const imap = new Imap(imapConfig)

    imap.once('ready', () => {
      // Tentar abrir a caixa de entrada para validar completamente
      imap.openBox('INBOX', true, (err) => {
        imap.end()
        if (err) {
          reject(new Error(`IMAP: Erro ao acessar caixa de entrada - ${err.message}`))
        } else {
          resolve()
        }
      })
    })

    imap.once('error', (err: Error) => {
      reject(new Error(`IMAP: ${err.message}`))
    })

    imap.once('end', () => {
      // Conexão encerrada normalmente
    })

    try {
      imap.connect()
    } catch (error) {
      reject(new Error(`IMAP: Erro de conexão - ${error instanceof Error ? error.message : 'Erro desconhecido'}`))
    }

    // Timeout de segurança
    setTimeout(() => {
      try {
        imap.end()
      } catch (e) {
        // Ignorar erros ao fechar
      }
      reject(new Error('IMAP: Timeout na conexão'))
    }, 20000)
  })
}

// Função para testar conexão SMTP
function testSmtpConnection(config: {
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  username: string
  password: string
}): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.username,
          pass: config.password,
        },
        connectionTimeout: 15000, // 15 segundos
        socketTimeout: 15000,     // 15 segundos
        tls: {
          rejectUnauthorized: false
        }
      })

      // Verificar conexão
      await transporter.verify()
      resolve()
    } catch (error) {
      reject(new Error(`SMTP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`))
    }
  })
}