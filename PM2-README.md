# Gerenciamento de Serviços PM2 - CRM MVP

Este documento descreve como gerenciar os serviços do CRM MVP usando PM2.

## Pré-requisitos

### 1. Instalar PM2
```bash
npm install -g pm2
```

### 2. Configurar ambiente
```bash
# Tornar o script executável
chmod +x pm2-manager.sh

# Executar configuração inicial
./pm2-manager.sh setup
```

## Serviços Configurados

### 1. crm-web
- **Descrição**: Aplicação Next.js principal
- **Porta**: 3000
- **Modo**: cluster
- **Instâncias**: 1 (pode ser escalado)
- **Restart automático**: Sim
- **Limite de memória**: 1GB

### 2. crm-webhook-worker
- **Descrição**: Worker para processar webhooks em background
- **Modo**: fork
- **Instâncias**: 1
- **Restart automático**: Sim
- **Limite de memória**: 512MB

### 3. crm-email-sync
- **Descrição**: Worker para sincronização de emails IMAP
- **Modo**: fork
- **Instâncias**: 1
- **Restart automático**: Sim (a cada 4 horas)
- **Limite de memória**: 512MB

## Comandos Disponíveis

### Gerenciamento Básico
```bash
# Iniciar todos os serviços
./pm2-manager.sh start

# Parar todos os serviços
./pm2-manager.sh stop

# Reiniciar todos os serviços
./pm2-manager.sh restart

# Recarregar serviços (zero downtime)
./pm2-manager.sh reload
```

### Monitoramento
```bash
# Ver status dos serviços
./pm2-manager.sh status

# Ver logs em tempo real
./pm2-manager.sh logs

# Ver logs apenas do serviço web
./pm2-manager.sh logs-web

# Abrir monitor interativo
./pm2-manager.sh monitor
```

### Manutenção
```bash
# Remover todos os serviços
./pm2-manager.sh delete

# Configuração inicial
./pm2-manager.sh setup

# Ajuda
./pm2-manager.sh help
```

## Comandos PM2 Diretos

### Gerenciar serviços individuais
```bash
# Iniciar apenas o serviço web
pm2 start crm-web

# Parar o worker de webhooks
pm2 stop crm-webhook-worker

# Reiniciar sincronização de email
pm2 restart crm-email-sync
```

### Escalabilidade
```bash
# Escalar serviço web para 4 instâncias
pm2 scale crm-web 4

# Reduzir para 2 instâncias
pm2 scale crm-web 2
```

### Logs específicos
```bash
# Logs do serviço web
pm2 logs crm-web

# Logs do worker de webhooks
pm2 logs crm-webhook-worker

# Logs de sincronização de email
pm2 logs crm-email-sync

# Logs com número específico de linhas
pm2 logs crm-web --lines 100
```

## Configuração de Produção

### 1. Variáveis de Ambiente
Edite o arquivo `ecosystem.config.js` para configurar:
- `DATABASE_URL`: String de conexão PostgreSQL
- `NEXTAUTH_URL`: URL da aplicação
- `NEXTAUTH_SECRET`: Chave secreta para NextAuth
- Outras variáveis específicas

### 2. Startup Script
Para iniciar automaticamente na inicialização do sistema:

```bash
# Salvar configuração atual
pm2 save

# Gerar script de startup
pm2 startup

# Seguir instruções mostradas pelo comando acima
```

### 3. Deploy Automático
O arquivo `ecosystem.config.js` inclui configuração para deploy:

```bash
# Deploy para produção
pm2 deploy production
```

## Monitoramento Avançado

### 1. PM2 Plus (opcional)
```bash
# Conectar ao PM2 Plus para monitoramento web
pm2 plus
```

### 2. Métricas customizadas
```bash
# Ver métricas detalhadas
pm2 show crm-web

# Monitor de CPU e memória
pm2 monit
```

## Logs e Diagnóstico

### Localização dos Logs
- Logs principais: `/var/log/pm2/`
- Erro web: `/var/log/pm2/crm-web-error.log`
- Output web: `/var/log/pm2/crm-web-out.log`
- Webhook worker: `/var/log/pm2/webhook-worker-*.log`
- Email sync: `/var/log/pm2/email-sync-*.log`

### Rotação de Logs
```bash
# Instalar módulo de rotação
pm2 install pm2-logrotate

# Configurar rotação
pm2 conf pm2-logrotate max_size 10M
pm2 conf pm2-logrotate retain 7
```

## Troubleshooting

### Problemas Comuns

1. **Serviço não inicia**
   ```bash
   # Verificar logs de erro
   pm2 logs crm-web --err --lines 50
   
   # Verificar configuração
   pm2 show crm-web
   ```

2. **Alto uso de memória**
   ```bash
   # Verificar uso atual
   pm2 monit
   
   # Reiniciar serviço específico
   pm2 restart crm-web
   ```

3. **Worker não processa**
   ```bash
   # Verificar logs do worker
   pm2 logs crm-webhook-worker
   
   # Reiniciar worker
   pm2 restart crm-webhook-worker
   ```

### Comandos de Diagnóstico
```bash
# Informações do sistema
pm2 info

# Lista detalhada de processos
pm2 list

# Dump da configuração atual
pm2 dump

# Ressuscitar configuração salva
pm2 resurrect
```

## Backup e Restauração

### Backup da Configuração
```bash
# Salvar configuração atual
pm2 save

# Fazer backup do arquivo de configuração
cp ~/.pm2/dump.pm2 backup/dump.pm2.$(date +%Y%m%d)
```

### Restauração
```bash
# Restaurar configuração
pm2 resurrect

# Ou restaurar de backup específico
cp backup/dump.pm2.20231201 ~/.pm2/dump.pm2
pm2 resurrect
```

## Integração com Docker

Se usando Docker, adicione ao `docker-compose.yml`:

```yaml
services:
  crm-web:
    # ... outras configurações
    command: ["./pm2-manager.sh", "start"]
    
  # Ou use PM2 diretamente no container
  crm-app:
    # ... outras configurações
    command: ["pm2-runtime", "start", "ecosystem.config.js"]
```

## Melhores Práticas

1. **Sempre salve configurações**: `pm2 save` após mudanças
2. **Use reload para zero downtime**: `pm2 reload` em produção
3. **Monitore logs regularmente**: Configure alertas para erros
4. **Configure limites de memória**: Evita consumo excessivo
5. **Use startup script**: Para inicialização automática
6. **Faça backup das configurações**: Regularmente
7. **Teste em ambiente de desenvolvimento**: Antes de produção

## Suporte e Logs

Para suporte, sempre inclua:
- Output de `pm2 status`
- Logs relevantes com `pm2 logs`
- Configuração com `pm2 show [app-name]`
- Informações do sistema com `pm2 info`