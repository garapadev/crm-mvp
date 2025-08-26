# CRM MVP Project Design

## Overview

This document outlines the design for a Minimum Viable Product (MVP) Customer Relationship Management (CRM) system. The MVP focuses on core CRM functionalities with a modern, responsive user interface built using React, shadcn/ui components, and TailwindCSS for styling.

### Project Goals
- Create a functional CRM system for managing customer relationships
- Implement hierarchical organizational structure with parent-child groups
- Provide role-based access control (RBAC) with permission groups
- Enable comprehensive employee management with CRUD operations
- Implement essential features for lead tracking, contact management, and sales pipeline
- Provide an intuitive, modern user interface
- Establish a scalable foundation for future ERP expansion

### Target Users
- System administrators managing organizational structure
- HR personnel managing employees and permissions
- Small to medium business sales teams
- Sales managers and representatives
- Customer service representatives

## Technology Stack & Dependencies

### Frontend Framework
- **React 18** with TypeScript for type safety
- **Next.js 14** for full-stack capabilities and routing
- **React Hook Form** for form management and validation

### UI & Styling
- **shadcn/ui** - Modern, accessible component library
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library integrated with shadcn/ui
- **Radix UI** - Unstyled, accessible UI primitives (shadcn/ui foundation)

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Server state management and caching

### Data & Backend Integration
- **Prisma** - Database ORM with PostGIS and pgvector support
- **PostgreSQL** - Primary database (garapadev/postgres-postgis-pgvector:15-stable)
- **PostGIS** - Spatial and geographic objects extension
- **pgvector** - Vector similarity search extension
- **NextAuth.js** - Authentication system with RBAC
- **Zod** - Schema validation
- **Swagger/OpenAPI** - API documentation and testing
- **Webhook System** - Event-driven integrations
- **node-imap** - IMAP client for email receiving
- **nodemailer** - SMTP client for email sending
- **mailparser** - Email parsing and processing
- **React DnD** - Drag and drop for Kanban boards

### Process Management
- **PM2** - Process manager for Node.js applications
- **PM2 Ecosystem** - Configuration for multiple services
- **PM2 Monitoring** - Real-time application monitoring

## Component Architecture

### Component Definition

#### Core Layout Components
```
Layout/
├── AppLayout - Main application shell
├── Sidebar - Navigation sidebar
├── Header - Top navigation bar
└── PageContainer - Content wrapper
```

#### Feature Components
```
CRM/
├── Dashboard/
│   ├── DashboardMetrics
│   ├── RecentActivities
│   └── QuickActions
├── Organization/
│   ├── GroupHierarchy
│   ├── GroupTree
│   ├── GroupForm
│   └── GroupDetails
├── Administration/
│   ├── PermissionGroups
│   ├── RoleManagement
│   ├── PermissionMatrix
│   └── AccessControl
├── Employees/
│   ├── EmployeeList
│   ├── EmployeeCard
│   ├── EmployeeForm
│   ├── EmployeeDetails
│   └── EmployeePermissions
├── Tasks/
│   ├── TaskList
│   ├── TaskTable
│   ├── TaskKanban
│   ├── TaskForm
│   ├── TaskDetails
│   ├── TaskFilters
│   └── TaskStats
├── Webmail/
│   ├── MailboxList
│   ├── EmailList
│   ├── EmailReader
│   ├── EmailComposer
│   ├── AttachmentViewer
│   ├── FolderTree
│   └── MailSettings
├── Contacts/
│   ├── ContactList
│   ├── ContactCard
│   ├── ContactForm
│   └── ContactDetails
├── Leads/
│   ├── LeadPipeline
│   ├── LeadCard
│   ├── LeadForm
│   └── LeadKanban
└── Activities/
    ├── ActivityTimeline
    ├── ActivityForm
    └── ActivityCard
```

#### Shared Components
```
UI/
├── DataTable - Reusable table component
├── SearchBar - Global search functionality
├── StatusBadge - Status indicators
├── ActionMenu - Dropdown action menus
└── FormFields - Custom form components
```

### Component Hierarchy

```mermaid
graph TD
    A[App] --> B[AppLayout]
    B --> C[Header]
    B --> D[Sidebar]
    B --> E[PageContainer]
    
    E --> F[Dashboard]
    E --> G[ContactsPage]
    E --> H[LeadsPage]
    E --> I[ActivitiesPage]
    
    F --> J[DashboardMetrics]
    F --> K[RecentActivities]
    F --> L[QuickActions]
    
    G --> M[ContactList]
    G --> N[ContactDetails]
    M --> O[ContactCard]
    
    H --> P[LeadPipeline]
    H --> Q[LeadKanban]
    P --> R[LeadCard]
```

### Props/State Management

#### Contact Management State
```typescript
interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  tags: string[]
  status: 'active' | 'inactive' | 'prospect'
  createdAt: Date
  updatedAt: Date
}

interface ContactStore {
  contacts: Contact[]
  selectedContact: Contact | null
  isLoading: boolean
  searchQuery: string
  filters: ContactFilters
}
```

#### Lead Management State
```typescript
interface Lead {
  id: string
  title: string
  contactId?: string
  value: number
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  source: string
  assignedTo: string
  probability: number
  expectedCloseDate?: Date
  createdAt: Date
}

interface LeadStore {
  leads: Lead[]
  pipelineStages: PipelineStage[]
  selectedLead: Lead | null
  isLoading: boolean
}
```

### Example Component Usage

#### Contact Form Component
```typescript
interface ContactFormProps {
  contact?: Contact
  onSubmit: (data: ContactFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  // Implementation using react-hook-form and shadcn/ui components
}
```

## Routing & Navigation

### Route Structure
```
/dashboard - Main dashboard with metrics and quick actions
/organization - Hierarchical group management
  /organization/groups - Group hierarchy view
  /organization/groups/new - Create new group
  /organization/groups/[id] - Group details and edit
/administration - System administration
  /administration/permissions - Permission group management
  /administration/roles - Role assignment
  /administration/access-control - Access control matrix
/employees - Employee management
  /employees - Employee list and search
  /employees/new - Create new employee
  /employees/[id] - Employee details and edit
  /employees/[id]/permissions - Employee permission assignment
/tasks - Task management
  /tasks - Task list with table/kanban toggle
  /tasks/table - Table view of tasks
  /tasks/kanban - Kanban board view
  /tasks/new - Create new task
  /tasks/[id] - Task details and edit
/webmail - Email client
  /webmail - Main email interface
  /webmail/inbox - Inbox folder
  /webmail/sent - Sent emails
  /webmail/drafts - Draft emails
  /webmail/compose - Compose new email
  /webmail/settings - Email account settings
/contacts - Contact management
  /contacts/new - Create new contact
  /contacts/[id] - Contact details and edit
/leads - Lead pipeline management
  /leads/new - Create new lead
  /leads/[id] - Lead details and edit
/activities - Activity timeline and management
/reports - Basic reporting (future enhancement)
/settings - Application settings
```

### Navigation Implementation
- **Next.js App Router** for file-based routing
- **Dynamic routes** for entity details
- **Breadcrumb navigation** for user orientation
- **Quick search** with global command palette (Cmd+K)

## Styling Strategy

### TailwindCSS Configuration
- **Custom color palette** aligned with CRM branding
- **Extended spacing scale** for consistent layouts
- **Component-specific utilities** for common patterns
- **Dark mode support** with CSS variables

### shadcn/ui Customization
- **Theme configuration** using CSS custom properties
- **Component variants** for different contexts
- **Consistent design tokens** across all components
- **Accessibility-first approach** with proper ARIA labels

### Design System
```css
:root {
  --primary: 210 40% 50%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --accent: 210 40% 96%;
  --destructive: 0 84% 60%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 210 40% 50%;
}
```

## State Management

### Zustand Store Architecture

#### Organization Store
```typescript
interface OrganizationStore {
  // State
  groups: Group[]
  groupHierarchy: GroupHierarchy
  selectedGroup: Group | null
  isLoading: boolean
  
  // Actions
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  deleteGroup: (id: string) => void
  moveGroup: (groupId: string, newParentId: string | null) => void
  buildHierarchy: () => void
}
```

#### Permission Store
```typescript
interface PermissionStore {
  // State
  permissionGroups: PermissionGroup[]
  roles: Role[]
  permissions: Permission[]
  selectedPermissionGroup: PermissionGroup | null
  
  // Actions
  setPermissionGroups: (groups: PermissionGroup[]) => void
  addPermissionGroup: (group: PermissionGroup) => void
  updatePermissionGroup: (id: string, updates: Partial<PermissionGroup>) => void
  assignPermissions: (groupId: string, permissions: string[]) => void
  checkPermission: (userId: string, resource: string, action: string) => boolean
}
```

#### Employee Store
```typescript
interface EmployeeStore {
  // State
  employees: Employee[]
  selectedEmployee: Employee | null
  isLoading: boolean
  searchQuery: string
  filters: EmployeeFilters
  
  // Actions
  setEmployees: (employees: Employee[]) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  selectEmployee: (employee: Employee | null) => void
  assignToGroup: (employeeId: string, groupId: string) => void
  assignPermissionGroup: (employeeId: string, permissionGroupId: string) => void
}
```

#### Task Store
```typescript
interface TaskStore {
  // State
  tasks: Task[]
  selectedTask: Task | null
  viewMode: 'table' | 'kanban'
  kanbanColumns: KanbanColumn[]
  filters: TaskFilters
  isLoading: boolean
  searchQuery: string
  
  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus, newPosition?: number) => void
  selectTask: (task: Task | null) => void
  setViewMode: (mode: 'table' | 'kanban') => void
  setFilters: (filters: Partial<TaskFilters>) => void
  setSearchQuery: (query: string) => void
}
```

#### Webmail Store
```typescript
interface WebmailStore {
  // State
  emails: Email[]
  selectedEmail: Email | null
  currentFolder: MailFolder
  folders: MailFolder[]
  accounts: EmailAccount[]
  isLoading: boolean
  isSyncing: boolean
  searchQuery: string
  composerState: ComposerState
  
  // Actions
  setEmails: (emails: Email[]) => void
  addEmail: (email: Email) => void
  updateEmail: (id: string, updates: Partial<Email>) => void
  deleteEmail: (id: string) => void
  moveEmail: (emailId: string, targetFolderId: string) => void
  selectEmail: (email: Email | null) => void
  setCurrentFolder: (folder: MailFolder) => void
  syncEmails: () => Promise<void>
  sendEmail: (emailData: SendEmailData) => Promise<void>
  saveDraft: (draftData: DraftEmailData) => Promise<void>
  openComposer: (type: 'new' | 'reply' | 'forward', email?: Email) => void
  closeComposer: () => void
}
```

#### Contact Store
```typescript
interface ContactStore {
  // State
  contacts: Contact[]
  selectedContact: Contact | null
  isLoading: boolean
  searchQuery: string
  
  // Actions
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  selectContact: (contact: Contact | null) => void
  setSearchQuery: (query: string) => void
}
```

#### Lead Store
```typescript
interface LeadStore {
  // State
  leads: Lead[]
  pipelineStages: PipelineStage[]
  selectedLead: Lead | null
  
  // Actions
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  moveLead: (leadId: string, newStage: string) => void
  deleteLead: (id: string) => void
}
```

### TanStack Query Integration
- **Query keys** for data caching and invalidation
- **Optimistic updates** for better user experience
- **Background refetching** for real-time data sync
- **Error handling** with retry logic

## API Integration Layer

### API Client Structure
```typescript
class CRMApiClient {
  // Organization operations
  getGroups(): Promise<Group[]>
  getGroup(id: string): Promise<Group>
  createGroup(data: CreateGroupData): Promise<Group>
  updateGroup(id: string, data: UpdateGroupData): Promise<Group>
  deleteGroup(id: string): Promise<void>
  getGroupHierarchy(): Promise<GroupHierarchy>
  
  // Permission operations
  getPermissionGroups(): Promise<PermissionGroup[]>
  getPermissionGroup(id: string): Promise<PermissionGroup>
  createPermissionGroup(data: CreatePermissionGroupData): Promise<PermissionGroup>
  updatePermissionGroup(id: string, data: UpdatePermissionGroupData): Promise<PermissionGroup>
  deletePermissionGroup(id: string): Promise<void>
  getPermissions(): Promise<Permission[]>
  assignPermissions(groupId: string, permissions: string[]): Promise<void>
  
  // Employee operations
  getEmployees(params?: EmployeeQueryParams): Promise<Employee[]>
  getEmployee(id: string): Promise<Employee>
  createEmployee(data: CreateEmployeeData): Promise<Employee>
  updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee>
  deleteEmployee(id: string): Promise<void>
  assignEmployeeToGroup(employeeId: string, groupId: string): Promise<void>
  assignEmployeePermissionGroup(employeeId: string, permissionGroupId: string): Promise<void>
  
  // Task operations
  getTasks(params?: TaskQueryParams): Promise<Task[]>
  getTask(id: string): Promise<Task>
  createTask(data: CreateTaskData): Promise<Task>
  updateTask(id: string, data: UpdateTaskData): Promise<Task>
  deleteTask(id: string): Promise<void>
  moveTask(taskId: string, newStatus: TaskStatus, newPosition?: number): Promise<void>
  getTasksByStatus(status: TaskStatus): Promise<Task[]>
  
  // Webmail operations
  getEmailAccounts(): Promise<EmailAccount[]>
  createEmailAccount(data: CreateEmailAccountData): Promise<EmailAccount>
  updateEmailAccount(id: string, data: UpdateEmailAccountData): Promise<EmailAccount>
  deleteEmailAccount(id: string): Promise<void>
  testEmailConnection(accountId: string): Promise<ConnectionTestResult>
  getEmails(accountId: string, folderId?: string, params?: EmailQueryParams): Promise<Email[]>
  getEmail(accountId: string, emailId: string): Promise<Email>
  sendEmail(accountId: string, emailData: SendEmailData): Promise<void>
  saveDraft(accountId: string, draftData: DraftEmailData): Promise<Email>
  moveEmail(accountId: string, emailId: string, targetFolderId: string): Promise<void>
  deleteEmail(accountId: string, emailId: string): Promise<void>
  markAsRead(accountId: string, emailId: string): Promise<void>
  markAsUnread(accountId: string, emailId: string): Promise<void>
  syncEmailAccount(accountId: string): Promise<SyncResult>
  getFolders(accountId: string): Promise<MailFolder[]>
  searchEmails(accountId: string, query: string, params?: EmailSearchParams): Promise<Email[]>
  
  // Contact operations with geospatial support
  getContacts(params?: ContactQueryParams): Promise<Contact[]>
  getContactsNearby(lat: number, lng: number, radius: number): Promise<Contact[]>
  getContact(id: string): Promise<Contact>
  createContact(data: CreateContactData): Promise<Contact>
  updateContact(id: string, data: UpdateContactData): Promise<Contact>
  deleteContact(id: string): Promise<void>
  
  // Lead operations
  getLeads(params?: LeadQueryParams): Promise<Lead[]>
  getLead(id: string): Promise<Lead>
  createLead(data: CreateLeadData): Promise<Lead>
  updateLead(id: string, data: UpdateLeadData): Promise<Lead>
  
  // Activity operations
  getActivities(params?: ActivityQueryParams): Promise<Activity[]>
  createActivity(data: CreateActivityData): Promise<Activity>
  
  // Webhook operations
  getWebhooks(): Promise<Webhook[]>
  createWebhook(data: CreateWebhookData): Promise<Webhook>
  updateWebhook(id: string, data: UpdateWebhookData): Promise<Webhook>
  deleteWebhook(id: string): Promise<void>
  testWebhook(id: string): Promise<WebhookTestResult>
  
  // Vector search operations
  searchSimilarContacts(query: string, limit?: number): Promise<Contact[]>
  searchSimilarLeads(query: string, limit?: number): Promise<Lead[]>
}
```

### Swagger/OpenAPI Documentation

#### API Documentation Structure
```yaml
# swagger.yaml
openapi: 3.0.3
info:
  title: CRM MVP API
  description: Comprehensive CRM system with hierarchical groups, RBAC, and geospatial features
  version: 1.0.0
  contact:
    name: CRM API Support
    email: api-support@company.com

servers:
  - url: http://localhost:3001/api
    description: Development server
  - url: https://api.crm.company.com
    description: Production server

paths:
  /employees:
    get:
      tags: [Employees]
      summary: Get all employees
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of employees
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Employee'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      tags: [Employees]
      summary: Create new employee
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateEmployeeRequest'
      responses:
        '201':
          description: Employee created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Employee'
                
  /tasks:
    get:
      tags: [Tasks]
      summary: Get all tasks
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [todo, in_progress, review, done]
        - name: assignedTo
          in: query
          schema:
            type: string
        - name: priority
          in: query
          schema:
            type: string
            enum: [low, medium, high, urgent]
      responses:
        '200':
          description: List of tasks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
    post:
      tags: [Tasks]
      summary: Create new task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskRequest'
      responses:
        '201':
          description: Task created successfully
          
  /tasks/{id}/move:
    patch:
      tags: [Tasks]
      summary: Move task to different status
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [todo, in_progress, review, done]
                position:
                  type: integer
      responses:
        '200':
          description: Task moved successfully
          
  /webmail/accounts:
    get:
      tags: [Webmail]
      summary: Get email accounts
      responses:
        '200':
          description: List of email accounts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EmailAccount'
    post:
      tags: [Webmail]
      summary: Create email account
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateEmailAccountRequest'
      responses:
        '201':
          description: Email account created successfully
          
  /webmail/accounts/{accountId}/emails:
    get:
      tags: [Webmail]
      summary: Get emails from account
      parameters:
        - name: accountId
          in: path
          required: true
          schema:
            type: string
        - name: folder
          in: query
          schema:
            type: string
            default: INBOX
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: List of emails
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Email'
                  
  /webmail/accounts/{accountId}/send:
    post:
      tags: [Webmail]
      summary: Send email
      parameters:
        - name: accountId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendEmailRequest'
      responses:
        '200':
          description: Email sent successfully
          
  /webmail/accounts/{accountId}/sync:
    post:
      tags: [Webmail]
      summary: Sync email account
      parameters:
        - name: accountId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Sync completed successfully
                
  /contacts/nearby:
    get:
      tags: [Contacts]
      summary: Find contacts near a location
      parameters:
        - name: lat
          in: query
          required: true
          schema:
            type: number
            format: double
        - name: lng
          in: query
          required: true
          schema:
            type: number
            format: double
        - name: radius
          in: query
          schema:
            type: number
            default: 1000
            description: Radius in meters
      responses:
        '200':
          description: Nearby contacts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Contact'
                  
  /webhooks:
    get:
      tags: [Webhooks]
      summary: Get all webhooks
      responses:
        '200':
          description: List of webhooks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Webhook'
    post:
      tags: [Webhooks]
      summary: Create new webhook
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWebhookRequest'
      responses:
        '201':
          description: Webhook created successfully
          
components:
  schemas:
    Employee:
      type: object
      properties:
        id:
          type: string
        employeeCode:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        position:
          type: string
        groupId:
          type: string
        status:
          type: string
          enum: [active, inactive, terminated]
        createdAt:
          type: string
          format: date-time
          
    Task:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [todo, in_progress, review, done]
        priority:
          type: string
          enum: [low, medium, high, urgent]
        assignedToId:
          type: string
        dueDate:
          type: string
          format: date-time
        createdAt:
          type: string
          format: date-time
          
    EmailAccount:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
        provider:
          type: string
        imapHost:
          type: string
        imapPort:
          type: integer
        smtpHost:
          type: string
        smtpPort:
          type: integer
        isActive:
          type: boolean
          
    Email:
      type: object
      properties:
        id:
          type: string
        messageId:
          type: string
        subject:
          type: string
        from:
          type: string
        to:
          type: array
          items:
            type: string
        body:
          type: string
        isRead:
          type: boolean
        hasAttachments:
          type: boolean
        receivedAt:
          type: string
          format: date-time
          
    Contact:
      type: object
      properties:
        id:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
        location:
          $ref: '#/components/schemas/GeoPoint'
        address:
          $ref: '#/components/schemas/Address'
          
    GeoPoint:
      type: object
      properties:
        type:
          type: string
          enum: [Point]
        coordinates:
          type: array
          items:
            type: number
          minItems: 2
          maxItems: 2
          
    Webhook:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        url:
          type: string
          format: uri
        events:
          type: array
          items:
            type: string
        isActive:
          type: boolean
        secret:
          type: string
          
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
security:
  - bearerAuth: []
```

### Webhook System Architecture

#### Webhook Events
```typescript
interface WebhookEvent {
  id: string
  type: WebhookEventType
  resourceType: 'employee' | 'contact' | 'lead' | 'activity' | 'group'
  resourceId: string
  action: 'created' | 'updated' | 'deleted'
  data: Record<string, any>
  metadata: {
    userId: string
    timestamp: Date
    userAgent?: string
    ipAddress?: string
  }
}

type WebhookEventType = 
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deleted'
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'group.created'
  | 'group.updated'
  | 'group.deleted'

interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEventType[]
  isActive: boolean
  secret: string
  retryPolicy: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  headers?: Record<string, string>
  createdAt: Date
  updatedAt: Date
  lastTriggeredAt?: Date
  totalDeliveries: number
  successfulDeliveries: number
}
```

#### Webhook Delivery System
```typescript
class WebhookDeliveryService {
  async deliverWebhook(
    webhook: Webhook, 
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    const payload = {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.metadata.timestamp.toISOString()
    }
    
    const signature = this.generateSignature(payload, webhook.secret)
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event.type,
      'X-Webhook-Id': event.id,
      ...webhook.headers
    }
    
    return await this.sendWebhook(webhook.url, payload, headers)
  }
  
  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return `sha256=${hmac.digest('hex')}`
  }
}
```

### Data Validation
- **Zod schemas** for runtime validation
- **TypeScript interfaces** for compile-time safety
- **Form validation** with react-hook-form integration

## Core Features Architecture

### Organization Management Module
```mermaid
graph LR
    A[Organization Management] --> B[Group Hierarchy]
    A --> C[Group CRUD]
    A --> D[Group Assignment]
    
    B --> E[Tree View]
    B --> F[Drag & Drop]
    C --> G[Create Group]
    C --> H[Edit Group]
    C --> I[Delete Group]
    D --> J[Assign Employees]
    D --> K[Bulk Assignment]
```

### RBAC Permission System
```mermaid
graph LR
    A[RBAC System] --> B[Permission Groups]
    A --> C[Role Management]
    A --> D[Access Control]
    
    B --> E[CRUD Operations]
    B --> F[Permission Matrix]
    C --> G[Assign Roles]
    C --> H[Role Hierarchy]
    D --> I[Resource Protection]
    D --> J[Action Authorization]
```

### Employee Management Module
```mermaid
graph LR
    A[Employee Management] --> B[Employee CRUD]
    A --> C[Permission Assignment]
    A --> D[Group Assignment]
    
    B --> E[Create Employee]
    B --> F[Update Employee]
    B --> G[Delete Employee]
    B --> H[Employee Search]
    C --> I[Assign Permissions]
    C --> J[Permission History]
    D --> K[Assign to Groups]
    D --> L[Group Hierarchy View]
```

### Task Management Module
```mermaid
graph LR
    A[Task Management] --> B[Task Views]
    A --> C[Task Operations]
    A --> D[Task Organization]
    
    B --> E[Table View]
    B --> F[Kanban Board]
    B --> G[Calendar View]
    C --> H[Create Task]
    C --> I[Update Task]
    C --> J[Delete Task]
    C --> K[Assign Task]
    D --> L[Status Management]
    D --> M[Priority System]
    D --> N[Filtering]
    D --> O[Drag & Drop]
```

### Webmail Client Module
```mermaid
graph LR
    A[Webmail Client] --> B[Account Management]
    A --> C[Email Operations]
    A --> D[Email Organization]
    
    B --> E[IMAP Configuration]
    B --> F[SMTP Configuration]
    B --> G[Account Sync]
    C --> H[Send Email]
    C --> I[Receive Email]
    C --> J[Reply/Forward]
    C --> K[Draft Management]
    D --> L[Folder Management]
    D --> M[Email Search]
    D --> N[Attachment Handling]
    D --> O[Email Filtering]
```

### Dashboard Module
```mermaid
graph LR
    A[Dashboard] --> B[Metrics Cards]
    A --> C[Recent Activities]
    A --> D[Quick Actions]
    A --> E[Pipeline Overview]
    
    B --> F[Total Employees]
    B --> G[Active Groups]
    B --> H[Total Contacts]
    B --> I[Active Leads]
    B --> J[Monthly Revenue]
    B --> K[Conversion Rate]
```

### Contact Management Module
```mermaid
graph LR
    A[Contact Management] --> B[Contact List]
    A --> C[Contact Details]
    A --> D[Contact Form]
    
    B --> E[Search & Filter]
    B --> F[Bulk Actions]
    C --> G[Activity History]
    C --> H[Related Leads]
```

### Lead Pipeline Module
```mermaid
graph LR
    A[Lead Pipeline] --> B[Kanban View]
    A --> C[List View]
    A --> D[Lead Details]
    
    B --> E[Drag & Drop]
    B --> F[Stage Management]
    C --> G[Sorting & Filtering]
    D --> H[Activity Tracking]
```

### Activity Management Module
```mermaid
graph LR
    A[Activity Management] --> B[Timeline View]
    A --> C[Activity Forms]
    A --> D[Task Management]
    
    B --> E[Filter by Type]
    B --> F[Search Activities]
    C --> G[Call Logging]
    C --> H[Meeting Scheduling]
```

### Webhook Integration Module
```mermaid
graph LR
    A[Webhook System] --> B[Event Publisher]
    A --> C[Webhook Manager]
    A --> D[Delivery Service]
    
    B --> E[Event Queue]
    B --> F[Event Validation]
    C --> G[Webhook CRUD]
    C --> H[Event Subscription]
    D --> I[HTTP Delivery]
    D --> J[Retry Logic]
    D --> K[Failure Handling]
```

### Geospatial Features Module
```mermaid
graph LR
    A[Geospatial Features] --> B[Location Services]
    A --> C[Proximity Search]
    A --> D[Map Integration]
    
    B --> E[Geocoding]
    B --> F[Reverse Geocoding]
    C --> G[Radius Search]
    C --> H[Boundary Search]
    D --> I[Contact Mapping]
    D --> J[Route Planning]
```

### Vector Search Module
```mermaid
graph LR
    A[Vector Search] --> B[Embedding Generation]
    A --> C[Similarity Search]
    A --> D[Content Matching]
    
    B --> E[Text Processing]
    B --> F[Vector Storage]
    C --> G[Cosine Similarity]
    C --> H[K-NN Search]
    D --> I[Contact Matching]
    D --> J[Lead Matching]
```

### API Documentation Module
```mermaid
graph LR
    A[Swagger/OpenAPI] --> B[Auto Documentation]
    A --> C[Interactive Testing]
    A --> D[Schema Validation]
    
    B --> E[Route Discovery]
    B --> F[Model Generation]
    C --> G[Test Console]
    C --> H[Request Builder]
    D --> I[Input Validation]
    D --> J[Response Validation]
```

## Testing Strategy

### Unit Testing
- **Vitest** for fast unit tests
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking
- **Test coverage** targets: 80% for business logic components

### Integration Testing
- **Playwright** for end-to-end testing
- **Critical user journeys** testing
- **Cross-browser compatibility** testing

### Testing Structure
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/
│   ├── contact-management.test.ts
│   ├── lead-pipeline.test.ts
│   └── dashboard.test.ts
└── e2e/
    ├── user-workflows.spec.ts
    └── critical-paths.spec.ts
```

### Test Examples
```typescript
// Employee CRUD test example
describe('EmployeeForm', () => {
  it('should create employee with group assignment', async () => {
    const mockSubmit = vi.fn()
    render(<EmployeeForm onSubmit={mockSubmit} />)
    
    await userEvent.type(screen.getByLabelText('First Name'), 'John')
    await userEvent.type(screen.getByLabelText('Email'), 'john@company.com')
    await userEvent.selectOptions(screen.getByLabelText('Group'), 'sales-team')
    await userEvent.click(screen.getByRole('button', { name: 'Create Employee' }))
    
    expect(mockSubmit).toHaveBeenCalledWith({
      firstName: 'John',
      email: 'john@company.com',
      groupId: 'sales-team'
    })
  })
})

// Permission test example
describe('PermissionSystem', () => {
  it('should check user permissions correctly', () => {
    const user = createMockUser({
      permissionGroups: [{ permissions: [{ resource: 'contacts', action: 'create' }] }]
    })
    
    expect(checkPermission(user, 'contacts', 'create')).toBe(true)
    expect(checkPermission(user, 'contacts', 'delete')).toBe(false)
  })
})
```

## Database Configuration

### PostgreSQL with Extensions

#### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: garapadev/postgres-postgis-pgvector:15-stable
    container_name: crm-postgres
    environment:
      POSTGRES_DB: crm_mvp
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements,pg_prewarm,vector
      -c pg_stat_statements.track=all
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crm_user -d crm_mvp"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  postgres_data:
```

#### Database Initialization
```sql
-- database/init/01-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable PostGIS
SELECT postgis_full_version();

-- Verify pgvector installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Prisma Schema with Extensions

#### Enhanced Prisma Configuration
```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, vector, uuid_ossp(map: "uuid-ossp"), pg_trgm]
}

model Contact {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  firstName       String
  lastName        String
  email           String    @unique
  phone           String?
  company         String?
  position        String?
  // PostGIS geometry field for location
  location        Unsupported("geometry(Point, 4326)")?
  // Address components
  street          String?
  city            String?
  state           String?
  zipCode         String?
  country         String    @default("Brazil")
  // Vector embedding for similarity search
  embedding       Unsupported("vector(1536)")?
  tags            String[]
  status          ContactStatus
  source          String
  assignedToId    String?   @db.Uuid
  createdById     String    @db.Uuid
  customFields    Json      @default("{}")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastContactedAt DateTime?

  // Relations
  assignedTo Employee? @relation("ContactAssignedTo", fields: [assignedToId], references: [id])
  createdBy  Employee  @relation("ContactCreatedBy", fields: [createdById], references: [id])
  leads      Lead[]
  activities Activity[]

  @@index([location], type: Gist)
  @@index([embedding], type: Ivfflat)
  @@index([email])
  @@index([assignedToId])
  @@map("contacts")
}

model Employee {
  id                   String              @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  employeeCode         String              @unique
  firstName            String
  lastName             String
  email                String              @unique
  phone                String?
  position             String
  department           String?
  hireDate             DateTime
  status               EmployeeStatus
  groupId              String?             @db.Uuid
  managerId            String?             @db.Uuid
  profilePicture       String?
  // Address with PostGIS support
  homeLocation         Unsupported("geometry(Point, 4326)")?
  street               String?
  city                 String?
  state                String?
  zipCode              String?
  country              String              @default("Brazil")
  emergencyContactName String?
  emergencyContactPhone String?
  customFields         Json                @default("{}")
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  lastLoginAt          DateTime?

  // Relations
  group                Group?              @relation(fields: [groupId], references: [id])
  manager              Employee?           @relation("EmployeeManager", fields: [managerId], references: [id])
  subordinates         Employee[]          @relation("EmployeeManager")
  permissionGroups     EmployeePermissionGroup[]
  assignedContacts     Contact[]           @relation("ContactAssignedTo")
  createdContacts      Contact[]           @relation("ContactCreatedBy")
  assignedLeads        Lead[]              @relation("LeadAssignedTo")
  createdLeads         Lead[]              @relation("LeadCreatedBy")
  assignedActivities   Activity[]          @relation("ActivityAssignedTo")
  createdActivities    Activity[]          @relation("ActivityCreatedBy")

  @@index([groupId])
  @@index([managerId])
  @@index([email])
  @@index([homeLocation], type: Gist)
  @@map("employees")
}

model Lead {
  id                String     @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  title             String
  description       String?
  contactId         String?    @db.Uuid
  value             Decimal    @db.Decimal(15, 2)
  currency          String     @default("BRL")
  stage             LeadStage
  source            String
  assignedToId      String     @db.Uuid
  createdById       String     @db.Uuid
  probability       Int        @default(0) @db.SmallInt
  expectedCloseDate DateTime?
  actualCloseDate   DateTime?
  lostReason        String?
  // Vector embedding for similarity search
  embedding         Unsupported("vector(1536)")?
  customFields      Json       @default("{}")
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  // Relations
  contact    Contact?   @relation(fields: [contactId], references: [id])
  assignedTo Employee   @relation("LeadAssignedTo", fields: [assignedToId], references: [id])
  createdBy  Employee   @relation("LeadCreatedBy", fields: [createdById], references: [id])
  activities Activity[]

  @@index([contactId])
  @@index([assignedToId])
  @@index([stage])
  @@index([embedding], type: Ivfflat)
  @@map("leads")
}

model Webhook {
  id                    String              @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name                  String
  url                   String
  events                WebhookEventType[]
  isActive              Boolean             @default(true)
  secret                String
  maxRetries            Int                 @default(3)
  retryDelay            Int                 @default(1000) // milliseconds
  backoffMultiplier     Float               @default(2.0)
  headers               Json                @default("{}")
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  lastTriggeredAt       DateTime?
  totalDeliveries       Int                 @default(0)
  successfulDeliveries  Int                 @default(0)
  
  // Relations
  deliveries            WebhookDelivery[]
  
  @@index([isActive])
  @@map("webhooks")
}

model WebhookDelivery {
  id                String              @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  webhookId         String              @db.Uuid
  eventId           String              @db.Uuid
  eventType         WebhookEventType
  payload           Json
  status            WebhookDeliveryStatus
  httpStatusCode    Int?
  responseBody      String?
  errorMessage      String?
  attemptNumber     Int                 @default(1)
  deliveredAt       DateTime?
  createdAt         DateTime            @default(now())
  
  // Relations
  webhook           Webhook             @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  
  @@index([webhookId])
  @@index([eventId])
  @@index([status])
  @@index([createdAt])
  @@map("webhook_deliveries")
}

enum WebhookEventType {
  EMPLOYEE_CREATED
  EMPLOYEE_UPDATED
  EMPLOYEE_DELETED
  CONTACT_CREATED
  CONTACT_UPDATED
  CONTACT_DELETED
  LEAD_CREATED
  LEAD_UPDATED
  LEAD_DELETED
  GROUP_CREATED
  GROUP_UPDATED
  GROUP_DELETED
}

enum WebhookDeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}
```

### Geospatial Functions

#### PostGIS Utility Functions
```sql
-- Custom functions for geospatial operations

-- Function to find contacts within radius
CREATE OR REPLACE FUNCTION find_contacts_nearby(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters FLOAT DEFAULT 1000
)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    ST_Distance(
      c.location::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) as distance_meters
  FROM contacts c
  WHERE c.location IS NOT NULL
    AND ST_DWithin(
      c.location::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION find_similar_contacts(
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.8,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM contacts c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

### Group Entity (Hierarchical)
```typescript
interface Group {
  id: string
  name: string
  description?: string
  parentId?: string // Reference to parent group
  level: number // Hierarchy level (0 = root)
  path: string // Full hierarchy path (e.g., "/root/sales/team1")
  isActive: boolean
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  
  // Relations
  parent?: Group
  children: Group[]
  employees: Employee[]
}
```

### Permission Group Entity (RBAC)
```typescript
interface PermissionGroup {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  isSystem: boolean // System-defined vs custom
  createdAt: Date
  updatedAt: Date
  
  // Relations
  employees: Employee[]
}

interface Permission {
  id: string
  resource: string // e.g., "contacts", "leads", "employees"
  action: string // e.g., "create", "read", "update", "delete"
  conditions?: Record<string, any> // Additional conditions
  description?: string
}

interface Role {
  id: string
  name: string
  description?: string
  permissionGroups: string[] // Array of permission group IDs
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Employee Entity
```typescript
interface Employee {
  id: string
  employeeCode: string // Unique employee identifier
  firstName: string
  lastName: string
  email: string
  phone?: string
  position: string
  department?: string
  hireDate: Date
  status: EmployeeStatus // 'active' | 'inactive' | 'terminated'
  groupId?: string // Reference to organizational group
  permissionGroupIds: string[] // Array of permission group IDs
  managerId?: string // Reference to manager (another employee)
  profilePicture?: string
  address?: Address
  emergencyContact?: EmergencyContact
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  
  // Relations
  group?: Group
  permissionGroups: PermissionGroup[]
  manager?: Employee
  subordinates: Employee[]
}

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

type EmployeeStatus = 'active' | 'inactive' | 'terminated'
```

### Task Entity
```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedToId?: string // Reference to employee
  createdById: string // Reference to employee who created
  projectId?: string // Future: link to projects
  contactId?: string // Optional: link to contact
  leadId?: string // Optional: link to lead
  dueDate?: Date
  completedAt?: Date
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  position: number // For kanban ordering
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
  
  // Relations
  assignedTo?: Employee
  createdBy: Employee
  contact?: Contact
  lead?: Lead
  subtasks: Task[]
  parentTask?: Task
  attachments: TaskAttachment[]
  comments: TaskComment[]
}

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedById: string
  createdAt: Date
}

interface TaskComment {
  id: string
  taskId: string
  content: string
  authorId: string
  createdAt: Date
  updatedAt: Date
}
```

### Email Account Entity
```typescript
interface EmailAccount {
  id: string
  name: string
  email: string
  provider: EmailProvider // 'gmail' | 'outlook' | 'custom'
  // IMAP Settings
  imapHost: string
  imapPort: number
  imapSecurity: 'none' | 'tls' | 'ssl'
  imapUsername: string
  imapPassword: string // Encrypted
  // SMTP Settings
  smtpHost: string
  smtpPort: number
  smtpSecurity: 'none' | 'tls' | 'ssl'
  smtpUsername: string
  smtpPassword: string // Encrypted
  // Settings
  isActive: boolean
  autoSync: boolean
  syncInterval: number // minutes
  maxSyncDays: number
  ownerId: string // Reference to employee
  signature?: string
  createdAt: Date
  updatedAt: Date
  lastSyncAt?: Date
  
  // Relations
  owner: Employee
  emails: Email[]
  folders: MailFolder[]
}

type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'custom'
```

### Email Entity
```typescript
interface Email {
  id: string
  accountId: string
  messageId: string // Original message ID from server
  threadId?: string // For email threading
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  replyTo?: EmailAddress[]
  body: string
  bodyHtml?: string
  bodyText?: string
  isRead: boolean
  isFlagged: boolean
  isDeleted: boolean
  hasAttachments: boolean
  priority: EmailPriority
  folderId: string
  labels: string[]
  receivedAt: Date
  sentAt?: Date
  size: number // in bytes
  internalId?: string // UID from IMAP server
  
  // CRM Integration
  linkedContactId?: string
  linkedLeadId?: string
  linkedTaskId?: string
  
  // Relations
  account: EmailAccount
  folder: MailFolder
  attachments: EmailAttachment[]
  linkedContact?: Contact
  linkedLead?: Lead
  linkedTask?: Task
}

interface EmailAddress {
  name?: string
  email: string
}

type EmailPriority = 'low' | 'normal' | 'high'

interface EmailAttachment {
  id: string
  emailId: string
  filename: string
  mimeType: string
  size: number
  contentId?: string // For inline attachments
  url?: string // If stored externally
  data?: Buffer // If stored in database
}

interface MailFolder {
  id: string
  accountId: string
  name: string
  path: string // Full IMAP path
  type: FolderType
  parentId?: string
  isSelectable: boolean
  totalMessages: number
  unreadMessages: number
  lastSyncAt?: Date
  
  // Relations
  account: EmailAccount
  emails: Email[]
  children: MailFolder[]
  parent?: MailFolder
}

type FolderType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom'
```

### Contact Entity
```typescript
interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  address?: Address
  tags: string[]
  status: ContactStatus
  source: string
  assignedTo?: string // Reference to employee
  createdBy: string // Reference to employee who created
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
  lastContactedAt?: Date
}
```

### Lead Entity
```typescript
interface Lead {
  id: string
  title: string
  description?: string
  contactId?: string
  value: number
  currency: string
  stage: LeadStage
  source: string
  assignedTo: string
  probability: number
  expectedCloseDate?: Date
  actualCloseDate?: Date
  lostReason?: string
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### Activity Entity
```typescript
interface Activity {
  id: string
  type: ActivityType
  subject: string
  description?: string
  contactId?: string
  leadId?: string
  assignedTo: string
  status: ActivityStatus
  scheduledAt?: Date
  completedAt?: Date
  duration?: number
  outcome?: string
  createdAt: Date
  updatedAt: Date
}
```

### Database Relationships
```mermaid
erDiagram
    Group ||--o{ Group : "parent-child"
    Group ||--o{ Employee : "belongs to"
    Employee ||--o{ Employee : "manager-subordinate"
    Employee }|--|| PermissionGroup : "has many"
    PermissionGroup ||--o{ Permission : "contains"
    Employee ||--o{ Contact : "assigned to"
    Employee ||--o{ Lead : "assigned to"
    Employee ||--o{ Activity : "assigned to"
    Employee ||--o{ Task : "assigned to"
    Employee ||--o{ Task : "created by"
    Employee ||--o{ EmailAccount : "owns"
    Contact ||--o{ Lead : "has many"
    Contact ||--o{ Activity : "has many"
    Contact ||--o{ Task : "linked to"
    Contact ||--o{ Email : "linked to"
    Lead ||--o{ Activity : "has many"
    Lead ||--o{ Task : "linked to"
    Lead ||--o{ Email : "linked to"
    Task ||--o{ Task : "parent-child"
    Task ||--o{ TaskAttachment : "has many"
    Task ||--o{ TaskComment : "has many"
    EmailAccount ||--o{ Email : "contains"
    EmailAccount ||--o{ MailFolder : "has many"
    MailFolder ||--o{ Email : "contains"
    MailFolder ||--o{ MailFolder : "parent-child"
    Email ||--o{ EmailAttachment : "has many"
    
    Group {
        string id PK
        string name
        string description
        string parentId FK
        int level
        string path
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    
    PermissionGroup {
        string id PK
        string name
        string description
        boolean isSystem
        timestamp createdAt
        timestamp updatedAt
    }
    
    Permission {
        string id PK
        string resource
        string action
        string description
        json conditions
    }
    
    Employee {
        string id PK
        string employeeCode
        string firstName
        string lastName
        string email
        string phone
        string position
        string groupId FK
        string managerId FK
        enum status
        date hireDate
        timestamp createdAt
        timestamp updatedAt
    }
    
    Task {
        string id PK
        string title
        text description
        enum status
        enum priority
        string assignedToId FK
        string createdById FK
        string contactId FK
        string leadId FK
        datetime dueDate
        datetime completedAt
        int position
        timestamp createdAt
        timestamp updatedAt
    }
    
    EmailAccount {
        string id PK
        string name
        string email
        enum provider
        string imapHost
        int imapPort
        string smtpHost
        int smtpPort
        string ownerId FK
        boolean isActive
        timestamp createdAt
        timestamp lastSyncAt
    }
    
    Email {
        string id PK
        string accountId FK
        string messageId
        string subject
        text body
        string folderId FK
        string linkedContactId FK
        string linkedLeadId FK
        boolean isRead
        boolean hasAttachments
        timestamp receivedAt
        timestamp createdAt
    }
    
    MailFolder {
        string id PK
        string accountId FK
        string name
        string path
        enum type
        string parentId FK
        int totalMessages
        int unreadMessages
        timestamp lastSyncAt
    }
    
    Contact {
        string id PK
        string firstName
        string lastName
        string email
        string phone
        string company
        enum status
        string assignedTo FK
        string createdBy FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Lead {
        string id PK
        string title
        decimal value
        enum stage
        string contactId FK
        string assignedTo FK
        date expectedCloseDate
        timestamp createdAt
    }
    
    Activity {
        string id PK
        enum type
        string subject
        string contactId FK
        string leadId FK
        string assignedTo FK
        timestamp scheduledAt
        timestamp createdAt
    }
```

## Process Management & Deployment

### PM2 Configuration

#### Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'crm-web',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/crm_db'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/crm_dev'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=4096'
    },
    {
      name: 'crm-api',
      script: './server/api.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://crm_user:password@localhost:5432/crm_mvp',
        WEBHOOK_SECRET: 'your-webhook-secret-key',
        SWAGGER_ENABLED: 'true',
        EMAIL_ENCRYPTION_KEY: 'your-email-encryption-key',
        IMAP_TIMEOUT: '30000',
        SMTP_TIMEOUT: '10000'
      },
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '512M'
    },
    {
      name: 'crm-worker',
      script: './server/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/crm_db'
      },
      error_file: './logs/worker-err.log',
      out_file: './logs/worker-out.log',
      log_file: './logs/worker-combined.log',
      time: true,
      max_memory_restart: '256M',
      cron_restart: '0 2 * * *' // Restart daily at 2 AM
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: ['server1.company.com', 'server2.company.com'],
      ref: 'origin/main',
      repo: 'git@github.com:company/crm-mvp.git',
      path: '/var/www/crm-production',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    },
    staging: {
      user: 'deploy',
      host: 'staging.company.com',
      ref: 'origin/develop',
      repo: 'git@github.com:company/crm-mvp.git',
      path: '/var/www/crm-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
```

#### Service Architecture
```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/HAProxy]
    end
    
    subgraph "PM2 Cluster"
        WEB1[Web App Instance 1]
        WEB2[Web App Instance 2]
        WEB3[Web App Instance 3]
        WEB4[Web App Instance 4]
        
        API1[API Server Instance 1]
        API2[API Server Instance 2]
        
        WORKER[Background Worker]
    end
    
    subgraph "Database Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    LB --> WEB1
    LB --> WEB2
    LB --> WEB3
    LB --> WEB4
    
    WEB1 --> API1
    WEB2 --> API1
    WEB3 --> API2
    WEB4 --> API2
    
    API1 --> PG
    API2 --> PG
    API1 --> REDIS
    API2 --> REDIS
    
    WORKER --> PG
    WORKER --> REDIS
```

### PM2 Management Commands

#### Development Commands
```bash
# Start development environment
pm2 start ecosystem.config.js --env development

# Monitor applications
pm2 monit

# View logs
pm2 logs crm-web
pm2 logs crm-api
pm2 logs crm-worker

# Restart specific service
pm2 restart crm-web
pm2 reload crm-api  # Zero-downtime restart

# Stop all services
pm2 stop all

# Delete all services
pm2 delete all
```

#### Production Deployment
```bash
# Deploy to production
pm2 deploy production

# Setup production environment
pm2 deploy production setup

# Update production deployment
pm2 deploy production update

# Rollback deployment
pm2 deploy production revert 1
```

### Monitoring & Health Checks

#### Application Monitoring
```javascript
// health-check.js
const express = require('express')
const app = express()

app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  }
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok')
  
  res.status(isHealthy ? 200 : 503).json(health)
})

module.exports = app
```

#### PM2 Monitoring Integration
```bash
# Install PM2 monitoring
npm install -g @pm2/io

# Start with monitoring
pm2 start ecosystem.config.js --attach

# Web monitoring dashboard
pm2 web

# Memory and CPU monitoring
pm2 monit
```

### Logging Strategy

#### Log Configuration
```javascript
// logger.js
const winston = require('winston')
const { combine, timestamp, errors, json, printf } = winston.format

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: process.env.PM2_INSTANCE_ID || 'crm-app',
    instance: process.env.PM2_INSTANCE_ID || 0
  },
  transports: [
    new winston.transports.File({ 
      filename: './logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: './logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: printf(({ level, message, timestamp, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
    })
  }))
}

module.exports = logger
```

### Security & Performance

#### Security Configuration
```javascript
// Security middleware for PM2 apps
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const compression = require('compression')

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

// Apply security middleware
app.use(helmet())
app.use(compression())
app.use('/api', limiter)
```

#### Performance Optimization
```javascript
// Performance monitoring
const responseTime = require('response-time')
const prometheus = require('prom-client')

// Metrics collection
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
})

app.use(responseTime((req, res, time) => {
  httpDuration
    .labels(req.method, req.route?.path || req.path, res.statusCode)
    .observe(time / 1000)
}))
```