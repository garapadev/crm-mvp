"use client"

import { useEffect, useRef } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
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
          <SwaggerUI 
            url="/api/swagger"
            docExpansion="list"
            defaultModelsExpandDepth={2}
            displayRequestDuration={true}
            tryItOutEnabled={true}
            requestInterceptor={(req) => {
              // Adicionar headers padrão se necessário
              req.headers['Content-Type'] = 'application/json'
              return req
            }}
          />
        </div>
      </div>
    </div>
  )
}