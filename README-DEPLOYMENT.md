# 🚀 Guia de Deploy - CRM MVP

Este guia contém instruções detalhadas para deploy da aplicação CRM MVP em diferentes ambientes.

## 📋 Pré-requisitos

### Requisitos do Sistema
- Node.js 18+ ou 20+
- PostgreSQL 14+
- Redis 6+
- PM2 (para gerenciamento de processos)
- Nginx (recomendado para proxy reverso)

### Dependências de Sistema
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server nginx

# CentOS/RHEL
sudo yum install -y nodejs npm postgresql-server redis nginx
```

## 🔧 Configuração de Ambiente

### 1. Desenvolvimento
```bash
# Use o arquivo .env existente
cp .env .env.local
# Edite as configurações conforme necessário
```

### 2. Staging
```bash
# Copie o template de staging
cp .env.staging .env

# Configure as variáveis específicas do ambiente:
# - DATABASE_URL
# - NEXTAUTH_URL
# - NEXTAUTH_SECRET
# - REDIS_URL
# - SMTP_* (configurações de email)
```

### 3. Produção
```bash
# Copie o template de produção
cp .env.production .env

# IMPORTANTE: Configure todas as variáveis obrigatórias:
# - DATABASE_URL (banco de produção)
# - NEXTAUTH_URL (domínio de produção)
# - NEXTAUTH_SECRET (secret forte e único)
# - REDIS_URL (Redis de produção)
# - JWT_SECRET (secret forte e único)
# - ENCRYPTION_KEY (chave de 32 caracteres)
```

## 🗄️ Configuração do Banco de Dados

### PostgreSQL Setup
```bash
# 1. Criar usuário e banco
sudo -u postgres psql
CREATE USER crm_user WITH PASSWORD 'secure_password';
CREATE DATABASE crm_mvp OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE crm_mvp TO crm_user;
\q

# 2. Executar migrations
npm run db:migrate

# 3. Executar seeds (opcional)
npm run db:seed
```

### Redis Setup
```bash
# Configurar Redis
sudo systemctl enable redis
sudo systemctl start redis

# Testar conexão
redis-cli ping
```

## 📦 Deploy da Aplicação

### 1. Build da Aplicação
```bash
# Instalar dependências
npm ci --production

# Build da aplicação Next.js
npm run build

# Verificar se o build foi bem-sucedido
ls -la .next/
```

### 2. Configuração do PM2
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Usar o arquivo de configuração existente
pm2 start ecosystem.config.js

# Verificar status
pm2 status
pm2 logs
```

### 3. Configuração do Nginx
```nginx
# /etc/nginx/sites-available/crm-mvp
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/crm-mvp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Workers e Serviços

### Iniciar Workers
```bash
# Webhook Worker
./scripts/start-webhook-worker.sh start

# Email Sync Worker
./scripts/start-email-worker.sh start

# Verificar status
./scripts/start-webhook-worker.sh status
./scripts/start-email-worker.sh status
```

### Configurar como Serviços do Sistema
```bash
# Criar arquivo de serviço para webhook worker
sudo tee /etc/systemd/system/crm-webhook-worker.service > /dev/null <<EOF
[Unit]
Description=CRM Webhook Worker
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=www-data
WorkingDirectory=/opt/crm-mvp
ExecStart=/opt/crm-mvp/scripts/start-webhook-worker.sh start
ExecStop=/opt/crm-mvp/scripts/start-webhook-worker.sh stop
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Criar arquivo de serviço para email worker
sudo tee /etc/systemd/system/crm-email-worker.service > /dev/null <<EOF
[Unit]
Description=CRM Email Sync Worker
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=www-data
WorkingDirectory=/opt/crm-mvp
ExecStart=/opt/crm-mvp/scripts/start-email-worker.sh start
ExecStop=/opt/crm-mvp/scripts/start-email-worker.sh stop
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Ativar serviços
sudo systemctl daemon-reload
sudo systemctl enable crm-webhook-worker
sudo systemctl enable crm-email-worker
sudo systemctl start crm-webhook-worker
sudo systemctl start crm-email-worker
```

## 📊 Monitoramento e Logs

### Configuração de Logs
```bash
# Criar diretórios de log
sudo mkdir -p /var/log/crm-mvp
sudo chown www-data:www-data /var/log/crm-mvp

# Configurar logrotate
sudo tee /etc/logrotate.d/crm-mvp > /dev/null <<EOF
/var/log/crm-mvp/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload crm-webhook-worker
        systemctl reload crm-email-worker
    endscript
}
EOF
```

### Monitoramento com PM2
```bash
# Monitoramento em tempo real
pm2 monit

# Logs em tempo real
pm2 logs

# Métricas
pm2 web
```

## 🔒 Segurança

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Bloquear acesso direto ao Node.js
sudo ufw deny 3000/tcp
```

### SSL/TLS
```bash
# Usando Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔄 Backup e Recuperação

### Backup do Banco de Dados
```bash
# Script de backup
#!/bin/bash
BACKUP_DIR="/var/backups/crm-mvp"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crm_mvp_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U crm_user crm_mvp > $BACKUP_FILE
gzip $BACKUP_FILE

# Manter apenas os últimos 30 backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Backup de Arquivos
```bash
# Backup de uploads e configurações
tar -czf /var/backups/crm-mvp/files_$(date +%Y%m%d).tar.gz \
    /opt/crm-mvp/.env \
    /var/uploads/crm-mvp/
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia**
   ```bash
   # Verificar logs
   pm2 logs
   # Verificar configurações
   npm run build
   ```

2. **Workers não funcionam**
   ```bash
   # Verificar status
   ./scripts/start-webhook-worker.sh status
   ./scripts/start-email-worker.sh status
   
   # Verificar logs
   tail -f logs/webhook-worker.log
   tail -f logs/email-sync-worker.log
   ```

3. **Problemas de banco**
   ```bash
   # Verificar conexão
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Verificar migrations
   npm run db:status
   ```

4. **Problemas de Redis**
   ```bash
   # Verificar status
   redis-cli ping
   
   # Verificar configuração
   redis-cli config get '*'
   ```

### Comandos Úteis
```bash
# Status geral do sistema
sudo systemctl status nginx postgresql redis crm-webhook-worker crm-email-worker

# Logs do sistema
sudo journalctl -u crm-webhook-worker -f
sudo journalctl -u crm-email-worker -f

# Reiniciar todos os serviços
sudo systemctl restart nginx postgresql redis
pm2 restart all
sudo systemctl restart crm-webhook-worker crm-email-worker
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs da aplicação
2. Consultar este guia
3. Verificar documentação do projeto
4. Contatar a equipe de desenvolvimento

---

**Nota**: Sempre teste o deploy em ambiente de staging antes de aplicar em produção.