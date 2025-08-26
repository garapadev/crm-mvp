import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CRM MVP API',
      version: '1.0.0',
      description: 'API completa para sistema CRM/ERP com gestão de colaboradores, tarefas, webmail e muito mais',
      contact: {
        name: 'CRM API Support',
        email: 'api-support@company.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: 'https://api.crm.company.com',
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Detalhes adicionais do erro',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Página atual',
            },
            limit: {
              type: 'integer',
              description: 'Itens por página',
            },
            totalCount: {
              type: 'integer',
              description: 'Total de itens',
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas',
            },
            hasNext: {
              type: 'boolean',
              description: 'Tem próxima página',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Tem página anterior',
            },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do colaborador',
            },
            employeeNumber: {
              type: 'string',
              description: 'Número do colaborador',
            },
            firstName: {
              type: 'string',
              description: 'Primeiro nome',
            },
            lastName: {
              type: 'string',
              description: 'Sobrenome',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do colaborador',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Telefone',
            },
            position: {
              type: 'string',
              nullable: true,
              description: 'Cargo',
            },
            department: {
              type: 'string',
              nullable: true,
              description: 'Departamento',
            },
            salary: {
              type: 'number',
              nullable: true,
              description: 'Salário',
            },
            hireDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de contratação',
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo/inativo',
            },
            group: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                path: { type: 'string' },
              },
            },
            permissionGroup: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da tarefa',
            },
            title: {
              type: 'string',
              description: 'Título da tarefa',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descrição detalhada',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'],
              description: 'Status da tarefa',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              description: 'Prioridade da tarefa',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de vencimento',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de início',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Data de conclusão',
            },
            estimatedHours: {
              type: 'integer',
              nullable: true,
              description: 'Horas estimadas',
            },
            actualHours: {
              type: 'integer',
              nullable: true,
              description: 'Horas trabalhadas',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags da tarefa',
            },
            assignee: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
            createdBy: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        EmailAccount: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da conta',
            },
            name: {
              type: 'string',
              description: 'Nome da conta',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Endereço de email',
            },
            type: {
              type: 'string',
              enum: ['IMAP', 'POP3', 'EXCHANGE'],
              description: 'Tipo da conta',
            },
            imapHost: {
              type: 'string',
              description: 'Servidor IMAP',
            },
            imapPort: {
              type: 'integer',
              description: 'Porta IMAP',
            },
            imapSecure: {
              type: 'boolean',
              description: 'SSL/TLS IMAP',
            },
            smtpHost: {
              type: 'string',
              description: 'Servidor SMTP',
            },
            smtpPort: {
              type: 'integer',
              description: 'Porta SMTP',
            },
            smtpSecure: {
              type: 'boolean',
              description: 'SSL/TLS SMTP',
            },
            isDefault: {
              type: 'boolean',
              description: 'Conta padrão',
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo/inativo',
            },
            employee: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        Email: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do email',
            },
            messageId: {
              type: 'string',
              description: 'Message-ID do email',
            },
            subject: {
              type: 'string',
              description: 'Assunto do email',
            },
            fromAddress: {
              type: 'string',
              description: 'Endereço do remetente',
            },
            fromName: {
              type: 'string',
              nullable: true,
              description: 'Nome do remetente',
            },
            toAddresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Destinatários',
            },
            ccAddresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Cópia (CC)',
            },
            bccAddresses: {
              type: 'array',
              items: { type: 'string' },
              description: 'Cópia oculta (BCC)',
            },
            bodyText: {
              type: 'string',
              nullable: true,
              description: 'Corpo do email (texto)',
            },
            bodyHtml: {
              type: 'string',
              nullable: true,
              description: 'Corpo do email (HTML)',
            },
            isRead: {
              type: 'boolean',
              description: 'Lido/não lido',
            },
            isStarred: {
              type: 'boolean',
              description: 'Favorito',
            },
            hasAttachments: {
              type: 'boolean',
              description: 'Possui anexos',
            },
            receivedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de recebimento',
            },
            emailAccount: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  filename: { type: 'string' },
                  contentType: { type: 'string' },
                  size: { type: 'integer' },
                },
              },
            },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do grupo',
            },
            name: {
              type: 'string',
              description: 'Nome do grupo',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descrição do grupo',
            },
            parentId: {
              type: 'string',
              nullable: true,
              description: 'ID do grupo pai',
            },
            level: {
              type: 'integer',
              description: 'Nível hierárquico',
            },
            path: {
              type: 'string',
              description: 'Caminho hierárquico',
            },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Group' },
              description: 'Grupos filhos',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
        PermissionGroup: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do grupo de permissão',
            },
            name: {
              type: 'string',
              description: 'Nome do grupo',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Descrição do grupo',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista de permissões',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts', // Arquivos da API para extrair documentação
  ],
}

export const swaggerSpec = swaggerJsdoc(options)