# 🚀 GarapaSystem-MVP - Sistema de Gestão de Relacionamento com Cliente

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma)

GarapaSystem-MVP é um sistema CRM moderno e completo construído com as melhores tecnologias do mercado. Oferece gestão completa de relacionamento com cliente, sistema de permissões granular, módulo de tarefas avançado e cliente webmail integrado.

## ✨ Funcionalidades Principais

### 🔐 **Sistema de Autenticação**
- Autenticação segura com NextAuth.js
- Funcionalidade "Lembrar de mim" 
- Proteção de rotas automática
- Sessões JWT seguras

### 👥 **Gestão de Colaboradores**
- CRUD completo de colaboradores
- Grupos hierárquicos (pai/filho) ilimitados
- Sistema RBAC granular com grupos de permissão
- Criação automática de usuários do sistema
- Filtros avançados e busca em tempo real

### 🎯 **Sistema de Tarefas**
- Visualização em **Kanban** com drag-and-drop
- Visualização em **Tabela** com ordenação
- Status customizáveis (TODO, EM_PROGRESSO, REVISÃO, CONCLUÍDA, CANCELADA)
- Prioridades configuráveis (BAIXA, MÉDIA, ALTA, CRÍTICA)
- Atribuição de responsáveis
- Comentários e anexos
- Controle de tempo estimado vs real

### 🔒 **Sistema RBAC Granular**
- Permissões organizadas por módulos:
  - `contacts` (create, read, update, delete)
  - `dashboard` (read)
  - `employees` (create, read, update, delete)
  - `groups` (create, read, update, delete)
  - `leads` (create, read, update, delete)
  - `permissions` (create, read, update, delete)
  - `tasks` (create, read, update, delete)
  - `webmail` (read)
- Interface intuitiva com checkboxes por módulo
- Grupos de permissão reutilizáveis
- Ativação/desativação de grupos

### 📧 **Cliente Webmail Integrado**
- Suporte completo a **IMAP/SMTP**
- Múltiplas contas de email
- Sincronização automática em background
- Composer de emails com anexos
- Organização por pastas
- Busca avançada de emails

### 🔗 **Sistema de Webhooks**
- Eventos granulares por entidade
- Tipos de evento: `criado`, `atualizado`, `excluído`
- Suporte a chave secreta com validação **HMAC SHA-256**
- Worker dedicado para processamento assíncrono
- Retry automático em caso de falha
- Logs detalhados de envio

### 📚 **API REST Documentada**
- Documentação completa com **Swagger/OpenAPI**
- Endpoints para todas as funcionalidades
- Autenticação via JWT
- Validação automática de dados
- Respostas padronizadas

## 🛠️ Stack Tecnológica

### **Frontend**
- **Next.js 14** - Framework React com App Router
- **React 19** - Biblioteca de interface de usuário
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI modernos
- **Radix UI** - Primitivos de UI acessíveis

### **Backend**
- **Next.js API Routes** - API REST integrada
- **NextAuth.js** - Autenticação segura
- **Prisma ORM** - Object-Relational Mapping
- **PostgreSQL 15** - Banco de dados principal
- **PostGIS** - Extensão geoespacial
- **pgvector** - Extensão para vetores

### **Infraestrutura**
- **PM2** - Gerenciador de processos
- **Docker** - Containerização do banco
- **Workers Node.js** - Processamento em background
- **IMAP/SMTP** - Integração de email

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Docker e Docker Compose
- PostgreSQL 15 (ou via Docker)

## 🚀 Instalação e Configuração

### 1. **Clone o repositório**
```bash
git clone https://github.com/garapadev/GarapaSystem-MVP.git
cd GarapaSystem-MVP
```

### 2. **Instale as dependências**
```bash
npm install
```

### 3. **Configure o banco de dados**
```bash
# Inicie o PostgreSQL via Docker
docker-compose up -d

# Execute as migrações
npx prisma migrate deploy

# Populate com dados iniciais
npx prisma db seed
```

### 4. **Configure as variáveis de ambiente**
Copie `.env.example` para `.env.local` e configure:

```env
# Database
DATABASE_URL="postgresql://crm_user:crm_password@localhost:5432/crm_mvp"

# NextAuth
NEXTAUTH_SECRET="seu-secret-super-seguro"
NEXTAUTH_URL="http://localhost:3000"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
```

### 5. **Inicie o sistema**

#### Desenvolvimento
```bash
npm run dev
```

#### Produção com PM2
```bash
# Inicie todos os serviços
npm run pm2:start

# Monitore os processos
npm run pm2:monitor

# Pare todos os serviços
npm run pm2:stop
```

## 🎮 Acesso ao Sistema

- **URL**: http://localhost:3000
- **Usuário**: admin@garapasystem.com
- **Senha**: admin123

## 📊 Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PM2 Manager   │    │   Workers       │    │   External APIs │
│   (Process Mgmt)│◄──►│   (Background)  │◄──►│   (SMTP/IMAP)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Estrutura do Projeto

```
src/
├── app/                          # App Router do Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticação
│   │   ├── employees/            # Colaboradores
│   │   ├── tasks/                # Tarefas
│   │   ├── webhooks/             # Webhooks
│   │   └── ...
│   ├── dashboard/                # Dashboard principal
│   ├── employees/                # Gestão de colaboradores
│   ├── tasks/                    # Sistema de tarefas
│   ├── webmail/                  # Cliente de email
│   └── administration/           # Área administrativa
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── layout/                   # Layout da aplicação
│   ├── tasks/                    # Componentes de tarefas
│   └── webmail/                  # Componentes de email
├── lib/                          # Bibliotecas e utilities
│   ├── auth.ts                   # Configuração NextAuth
│   ├── prisma.ts                 # Cliente Prisma
│   ├── permissions.ts            # Sistema RBAC
│   └── email-service.ts          # Serviço de email
├── workers/                      # Workers de background
│   ├── email-sync-worker.js      # Sincronização de emails
│   └── webhook-worker.js         # Processamento de webhooks
└── middleware.ts                 # Middleware de autenticação
```

## 📈 Funcionalidades em Desenvolvimento

- [ ] **Dashboard Avançado** - Gráficos e métricas em tempo real
- [ ] **Módulo de Vendas** - Pipeline de vendas e relatórios
- [ ] **Integração WhatsApp** - Chat integrado ao CRM
- [ ] **Relatórios Avançados** - Exportação em PDF e Excel
- [ ] **Mobile App** - Aplicativo React Native
- [ ] **API GraphQL** - Alternativa à API REST
- [ ] **Notificações Push** - Notificações em tempo real
- [ ] **Backup Automático** - Backup incremental do banco

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 **Email**: suporte@garapasystem.com
- 📚 **Documentação**: [Wiki do Projeto](https://github.com/garapadev/GarapaSystem-MVP/wiki)
- 🐛 **Issues**: [GitHub Issues](https://github.com/garapadev/GarapaSystem-MVP/issues)
- 💬 **Discord**: [Comunidade GarapaSystem](https://discord.gg/garapasystem)

---

<div align="center">
  <strong>Desenvolvido com ❤️ usando as melhores tecnologias</strong>
</div>