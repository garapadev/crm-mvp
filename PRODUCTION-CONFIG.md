# Configuração de Produção - CRM MVP

Este documento detalha como configurar adequadamente o ambiente de produção para o sistema CRM MVP.

## 📋 Pré-requisitos

- Node.js 18+ ou 20+
- PostgreSQL 14+
- Redis 6+
- Nginx (recomendado)
- PM2 para gerenciamento de processos
- Certificado SSL/TLS

## 🔧 Configuração de Variáveis de Ambiente

### 1. Configuração Básica

```bash
# Copie o arquivo de exemplo
cp .env.production .env

# Edite as configurações
nano .env
```

### 2. Banco de Dados (PostgreSQL)

```bash
# Substitua pelos dados reais do seu PostgreSQL
DATABASE_URL="postgresql://crm_user:secure_password@localhost:5432/crm_production"
```

**Configuração do PostgreSQL:**
```sql
-- Criar usuário e banco
CREATE USER crm_user WITH PASSWORD 'secure_password';
CREATE DATABASE crm_production OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE crm_production TO crm_user;
```

### 3. NextAuth (Autenticação)

```bash
# URL da aplicação em produção
NEXTAUTH_URL="https://crm.suaempresa.com"

# Gere um secret seguro
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 4. Redis (Cache e Sessões)

```bash
# Configuração do Redis
REDIS_URL="redis://localhost:6379"
# ou com autenticação:
REDIS_URL="redis://:password@localhost:6379"
```

### 5. Configuração de Email

#### SMTP (Envio de emails)
```bash
# Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="noreply@suaempresa.com"
SMTP_SECURE="true"

# SendGrid
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.sua-api-key"
```

#### IMAP (Sincronização de emails)
```bash
# Gmail
IMAP_HOST="imap.gmail.com"
IMAP_PORT="993"
IMAP_USER="seu-email@gmail.com"
IMAP_PASS="sua-senha-de-app"
IMAP_TLS="true"
```

### 6. Segurança

```bash
# Gere chaves seguras
JWT_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -base64 32)"
```

### 7. Configuração de Performance

```bash
# Ajuste conforme recursos do servidor
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000
QUERY_TIMEOUT=15000
```

### 8. Logging

```bash
# Crie os diretórios de log
sudo mkdir -p /var/log/crm-mvp
sudo chown $USER:$USER /var/log/crm-mvp

LOG_LEVEL="info"
LOG_FILE="/var/log/crm-mvp/app.log"
ERROR_LOG_FILE="/var/log/crm-mvp/error.log"
```

### 9. Upload de Arquivos

```bash
# Crie o diretório de uploads
sudo mkdir -p /var/uploads/crm-mvp
sudo chown $USER:$USER /var/uploads/crm-mvp

MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR="/var/uploads/crm-mvp"
```

### 10. CORS

```bash
# Configure os domínios permitidos
CORS_ORIGIN="https://crm.suaempresa.com,https://www.crm.suaempresa.com"
CORS_CREDENTIALS="true"
```

## 🚀 Deploy da Aplicação

### 1. Preparação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd crm-mvp

# Instale dependências
npm ci --production

# Configure ambiente
cp .env.production .env
# Edite .env com suas configurações
```

### 2. Build da Aplicação

```bash
# Build do Next.js
npm run build

# Execute migrações do banco
npm run migration:run

# Execute seeds (opcional)
npm run seed:run
```

### 3. Configuração do PM2

```bash
# Instale PM2 globalmente
npm install -g pm2

# Use o arquivo de configuração
pm2 start ecosystem.config.js --env production

# Salve a configuração
pm2 save
pm2 startup
```

### 4. Configuração do Nginx

```nginx
# /etc/nginx/sites-available/crm-mvp
server {
    listen 80;
    server_name crm.suaempresa.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.suaempresa.com;

    ssl_certificate /etc/ssl/certs/crm.suaempresa.com.crt;
    ssl_certificate_key /etc/ssl/private/crm.suaempresa.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Configuração para uploads
    client_max_body_size 10M;

    # Logs
    access_log /var/log/nginx/crm-mvp.access.log;
    error_log /var/log/nginx/crm-mvp.error.log;
}
```

```bash
# Ative o site
sudo ln -s /etc/nginx/sites-available/crm-mvp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuração de SSL

### Usando Let's Encrypt (Certbot)

```bash
# Instale certbot
sudo apt install certbot python3-certbot-nginx

# Obtenha certificado
sudo certbot --nginx -d crm.suaempresa.com

# Configure renovação automática
sudo crontab -e
# Adicione: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### 1. Logs da Aplicação

```bash
# Visualizar logs em tempo real
pm2 logs

# Logs específicos
pm2 logs crm-app
pm2 logs webhook-worker
pm2 logs email-worker
```

### 2. Monitoramento do Sistema

```bash
# Status dos processos
pm2 status

# Monitoramento em tempo real
pm2 monit

# Informações detalhadas
pm2 show crm-app
```

### 3. Health Checks

```bash
# Verificar saúde da aplicação
curl https://crm.suaempresa.com/api/health

# Configurar monitoramento externo (opcional)
# Use serviços como UptimeRobot, Pingdom, etc.
```

## 🔄 Backup e Recuperação

### 1. Backup do Banco de Dados

```bash
# Script de backup automático
#!/bin/bash
# /opt/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/crm-mvp"
DB_NAME="crm_production"

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
```

### 2. Configurar Cron para Backup

```bash
# Adicionar ao crontab
sudo crontab -e

# Backup diário às 2h da manhã
0 2 * * * /opt/scripts/backup-db.sh
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia**
   ```bash
   # Verificar logs
   pm2 logs crm-app
   
   # Verificar configurações
   npm run type-check
   ```

2. **Erro de conexão com banco**
   ```bash
   # Testar conexão
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Workers não funcionam**
   ```bash
   # Verificar status
   pm2 status
   
   # Reiniciar workers
   pm2 restart webhook-worker
   pm2 restart email-worker
   ```

4. **Problemas de SSL**
   ```bash
   # Verificar certificado
   sudo certbot certificates
   
   # Renovar se necessário
   sudo certbot renew
   ```

## 📞 Suporte

Para suporte técnico, consulte:
- Logs da aplicação: `/var/log/crm-mvp/`
- Logs do Nginx: `/var/log/nginx/`
- Status dos processos: `pm2 status`
- Health check: `https://seu-dominio.com/api/health`