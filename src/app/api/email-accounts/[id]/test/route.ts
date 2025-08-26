import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Imap from 'node-imap'
import * as nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// POST /api/email-accounts/[id]/test - Testar conexão da conta de email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da conta de email é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a conta de email
    const emailAccount = await prisma.emailAccount.findUnique({
      where: { id }
    })

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'Conta de email não encontrada' },
        { status: 404 }
      )
    }

    const testResults = {
      imap: { success: false, error: null as string | null },
      smtp: { success: false, error: null as string | null },
    }

    // Testar conexão IMAP
    try {
      await testImapConnection(emailAccount)
      testResults.imap.success = true
    } catch (error) {
      testResults.imap.error = error instanceof Error ? error.message : 'Erro desconhecido no IMAP'
    }

    // Testar conexão SMTP
    try {
      await testSmtpConnection(emailAccount)
      testResults.smtp.success = true
    } catch (error) {
      testResults.smtp.error = error instanceof Error ? error.message : 'Erro desconhecido no SMTP'
    }

    const overallSuccess = testResults.imap.success && testResults.smtp.success

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Conexão testada com sucesso' 
        : 'Falha em uma ou mais conexões',
      details: testResults
    })

  } catch (error) {
    console.error('Erro ao testar conexão de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao testar conexão' },
      { status: 500 }
    )
  }
}

// Função para testar conexão IMAP
function testImapConnection(emailAccount: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: emailAccount.username,
      password: emailAccount.password,
      host: emailAccount.imapHost,
      port: emailAccount.imapPort,
      tls: emailAccount.imapSecure,
      connTimeout: 10000, // 10 segundos
      authTimeout: 5000,  // 5 segundos
    }

    const imap = new Imap(imapConfig)

    imap.once('ready', () => {
      imap.end()
      resolve()
    })

    imap.once('error', (err: Error) => {
      reject(new Error(`IMAP Error: ${err.message}`))
    })

    imap.once('end', () => {
      // Conexão encerrada normalmente
    })

    try {
      imap.connect()
    } catch (error) {
      reject(new Error(`IMAP Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}

// Função para testar conexão SMTP
function testSmtpConnection(emailAccount: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const transporter = nodemailer.createTransport({
        host: emailAccount.smtpHost,
        port: emailAccount.smtpPort,
        secure: emailAccount.smtpSecure,
        auth: {
          user: emailAccount.username,
          pass: emailAccount.password,
        },
        connectionTimeout: 10000, // 10 segundos
        socketTimeout: 10000,     // 10 segundos
      })

      // Verificar conexão
      await transporter.verify()
      resolve()
    } catch (error) {
      reject(new Error(`SMTP Error: ${error instanceof Error ? error.message : 'Unknown error'}`))
    }
  })
}