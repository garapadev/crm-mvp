import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Por enquanto, deixar todas as rotas passarem
  // TODO: Implementar verificação de autenticação quando NextAuth v5 estiver estável
  const { pathname } = request.nextUrl
  
  // Rotas públicas que não precisam de autenticação
  if (pathname.startsWith('/auth') || pathname === '/') {
    return NextResponse.next()
  }
  
  // Por enquanto, permitir acesso a todas as outras rotas
  // Em produção, implementar verificação de token aqui
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas as rotas exceto:
     * - api/auth (rotas do NextAuth)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}