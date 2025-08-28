"use client"

import { useEffect, useRef } from 'react'
import 'swagger-ui-dist/swagger-ui.css'

// Import do SwaggerUIBundle
const SwaggerUIBundle = require('swagger-ui-dist').SwaggerUIBundle

export default function ApiDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!swaggerRef.current) return

    SwaggerUIBundle({
      domNode: swaggerRef.current,
      url: '/api/swagger',
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Adicionar headers padrão se necessário
        req.headers['Content-Type'] = 'application/json'
        return req
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Documentação da API - CRM MVP
          </h1>
          <p className="text-gray-600">
            Documentação completa da API RESTful do sistema CRM/ERP
          </p>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div ref={swaggerRef} className="swagger-ui-wrapper" />
        </div>
      </div>
    </div>
  )
}