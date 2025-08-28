#!/bin/bash

# Scripts para gerenciar serviços PM2 do CRM MVP

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}CRM MVP - Gerenciador de Serviços PM2${NC}"
    echo ""
    echo "Uso: ./pm2-manager.sh [COMANDO]"
    echo ""
    echo "Comandos disponíveis:"
    echo ""
    echo "📋 Gerenciamento Geral:"
    echo "  start           - Iniciar todos os serviços"
    echo "  stop            - Parar todos os serviços"
    echo "  restart         - Reiniciar todos os serviços"
    echo "  reload          - Recarregar todos os serviços (zero downtime)"
    echo "  status          - Mostrar status dos serviços"
    echo "  health          - Verificar saúde dos serviços"
    echo "  delete          - Remover todos os serviços"
    echo "  setup           - Configuração inicial"
    echo ""
    echo "🔧 Gerenciamento Individual:"
    echo "  start-service   <nome>     - Iniciar serviço específico"
    echo "  stop-service    <nome>     - Parar serviço específico"
    echo "  restart-service <nome>     - Reiniciar serviço específico"
    echo "  scale           <nome> <n> - Escalar serviço para N instâncias"
    echo ""
    echo "📝 Logs e Monitoramento:"
    echo "  logs            - Mostrar logs em tempo real (todos)"
    echo "  logs-web        - Mostrar logs apenas do serviço web"
    echo "  logs-workers    - Mostrar logs dos workers"
    echo "  logs-service    <nome>     - Mostrar logs de serviço específico"
    echo "  monitor         - Abrir monitor PM2"
    echo "  flush           - Limpar todos os logs"
    echo ""
    echo "🛠️ Manutenção:"
    echo "  backup          - Fazer backup da configuração"
    echo "  update          - Atualizar aplicação completa"
    echo "  help            - Mostrar esta ajuda"
    echo ""
    echo "📌 Serviços disponíveis: crm-web, webhook-worker, email-sync"
}

# Função para verificar se PM2 está instalado
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 não está instalado!${NC}"
        echo -e "${YELLOW}Instale com: npm install -g pm2${NC}"
        exit 1
    fi
}

# Função para verificar se o arquivo de configuração existe
check_config() {
    if [ ! -f "ecosystem.config.js" ]; then
        echo -e "${RED}❌ Arquivo ecosystem.config.js não encontrado!${NC}"
        echo -e "${YELLOW}Execute: ./pm2-manager.sh setup${NC}"
        exit 1
    fi
}

# Configuração inicial
setup() {
    echo -e "${BLUE}🔧 Configurando ambiente...${NC}"
    
    # Criar diretório de logs se não existir
    sudo mkdir -p /var/log/pm2
    sudo chmod 755 /var/log/pm2
    
    # Instalar dependências do workers se necessário
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências...${NC}"
        npm install
    fi
    
    # Executar build se necessário
    if [ ! -d ".next" ]; then
        echo -e "${YELLOW}🏗️ Executando build...${NC}"
        npm run build
    fi
    
    echo -e "${GREEN}✅ Configuração concluída!${NC}"
}

# Iniciar todos os serviços
start_services() {
    echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ Serviços iniciados!${NC}"
}

# Parar todos os serviços
stop_services() {
    echo -e "${YELLOW}⏹️ Parando serviços...${NC}"
    pm2 stop ecosystem.config.js
    echo -e "${GREEN}✅ Serviços parados!${NC}"
}

# Reiniciar todos os serviços
restart_services() {
    echo -e "${YELLOW}🔄 Reiniciando serviços...${NC}"
    pm2 restart ecosystem.config.js
    echo -e "${GREEN}✅ Serviços reiniciados!${NC}"
}

# Recarregar todos os serviços (zero downtime)
reload_services() {
    echo -e "${YELLOW}🔄 Recarregando serviços (zero downtime)...${NC}"
    pm2 reload ecosystem.config.js
    echo -e "${GREEN}✅ Serviços recarregados!${NC}"
}

# Mostrar status dos serviços
show_status() {
    echo -e "${BLUE}📊 Status dos serviços:${NC}"
    pm2 status
    echo ""
    echo -e "${BLUE}💾 Uso de memória:${NC}"
    pm2 monit --lines 5
}

# Mostrar logs em tempo real
show_logs() {
    echo -e "${BLUE}📝 Logs em tempo real (Ctrl+C para sair):${NC}"
    pm2 logs --lines 50
}

# Mostrar logs apenas do serviço web
show_web_logs() {
    echo -e "${BLUE}📝 Logs do serviço web (Ctrl+C para sair):${NC}"
    pm2 logs crm-web --lines 50
}

# Mostrar logs dos workers
show_worker_logs() {
    echo -e "${BLUE}📝 Logs dos workers (Ctrl+C para sair):${NC}"
    pm2 logs webhook-worker email-sync --lines 50
}

# Mostrar logs de um serviço específico
show_service_logs() {
    if [ -z "$2" ]; then
        echo -e "${RED}❌ Especifique o nome do serviço${NC}"
        echo "Serviços disponíveis: crm-web, webhook-worker, email-sync"
        exit 1
    fi
    echo -e "${BLUE}📝 Logs do serviço $2 (Ctrl+C para sair):${NC}"
    pm2 logs "$2" --lines 50
}

# Reiniciar serviço específico
restart_service() {
    if [ -z "$2" ]; then
        echo -e "${RED}❌ Especifique o nome do serviço${NC}"
        echo "Serviços disponíveis: crm-web, webhook-worker, email-sync"
        exit 1
    fi
    echo -e "${YELLOW}🔄 Reiniciando serviço $2...${NC}"
    pm2 restart "$2"
    echo -e "${GREEN}✅ Serviço $2 reiniciado!${NC}"
}

# Parar serviço específico
stop_service() {
    if [ -z "$2" ]; then
        echo -e "${RED}❌ Especifique o nome do serviço${NC}"
        echo "Serviços disponíveis: crm-web, webhook-worker, email-sync"
        exit 1
    fi
    echo -e "${YELLOW}⏹️ Parando serviço $2...${NC}"
    pm2 stop "$2"
    echo -e "${GREEN}✅ Serviço $2 parado!${NC}"
}

# Iniciar serviço específico
start_service() {
    if [ -z "$2" ]; then
        echo -e "${RED}❌ Especifique o nome do serviço${NC}"
        echo "Serviços disponíveis: crm-web, webhook-worker, email-sync"
        exit 1
    fi
    echo -e "${BLUE}🚀 Iniciando serviço $2...${NC}"
    pm2 start ecosystem.config.js --only "$2"
    echo -e "${GREEN}✅ Serviço $2 iniciado!${NC}"
}

# Escalar serviço (alterar número de instâncias)
scale_service() {
    if [ -z "$2" ] || [ -z "$3" ]; then
        echo -e "${RED}❌ Especifique o nome do serviço e número de instâncias${NC}"
        echo "Uso: ./pm2-manager.sh scale <serviço> <instâncias>"
        echo "Exemplo: ./pm2-manager.sh scale webhook-worker 3"
        exit 1
    fi
    echo -e "${BLUE}📈 Escalando serviço $2 para $3 instâncias...${NC}"
    pm2 scale "$2" "$3"
    echo -e "${GREEN}✅ Serviço $2 escalado para $3 instâncias!${NC}"
}

# Flush logs
flush_logs() {
    echo -e "${YELLOW}🗑️ Limpando logs...${NC}"
    pm2 flush
    echo -e "${GREEN}✅ Logs limpos!${NC}"
}

# Backup de configuração
backup_config() {
    echo -e "${BLUE}💾 Fazendo backup da configuração...${NC}"
    cp ecosystem.config.js "ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)"
    pm2 dump
    echo -e "${GREEN}✅ Backup criado!${NC}"
}

# Verificar saúde dos serviços
health_check() {
    echo -e "${BLUE}🏥 Verificando saúde dos serviços...${NC}"
    echo ""
    
    # Verificar se os serviços estão rodando
    services=("crm-web" "webhook-worker" "email-sync")
    
    for service in "${services[@]}"; do
        status=$(pm2 jlist | jq -r ".[] | select(.name==\"$service\") | .pm2_env.status")
        if [ "$status" = "online" ]; then
            echo -e "${GREEN}✅ $service: Online${NC}"
        elif [ "$status" = "stopped" ]; then
            echo -e "${RED}❌ $service: Parado${NC}"
        elif [ "$status" = "errored" ]; then
            echo -e "${RED}💥 $service: Com erro${NC}"
        else
            echo -e "${YELLOW}⚠️ $service: Status desconhecido ($status)${NC}"
        fi
    done
    
    echo ""
    echo -e "${BLUE}📊 Resumo do sistema:${NC}"
    pm2 status
}

# Atualizar aplicação
update_app() {
    echo -e "${BLUE}🔄 Atualizando aplicação...${NC}"
    
    # Fazer backup
    backup_config
    
    # Atualizar código
    git pull origin main
    
    # Instalar dependências
    npm ci
    
    # Build da aplicação
    npm run build
    
    # Executar migrations
    npm run db:migrate
    
    # Recarregar serviços
    pm2 reload ecosystem.config.js
    
    echo -e "${GREEN}✅ Aplicação atualizada!${NC}"
}

# Abrir monitor PM2
open_monitor() {
    echo -e "${BLUE}📊 Abrindo monitor PM2...${NC}"
    pm2 monit
}

# Remover todos os serviços
delete_services() {
    echo -e "${RED}🗑️ Removendo todos os serviços...${NC}"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 delete ecosystem.config.js
        pm2 save --force
        echo -e "${GREEN}✅ Serviços removidos!${NC}"
    else
        echo -e "${YELLOW}❌ Operação cancelada${NC}"
    fi
}

# Função principal
main() {
    check_pm2
    
    case $1 in
        start)
            check_config
            start_services
            ;;
        stop)
            check_config
            stop_services
            ;;
        restart)
            check_config
            restart_services
            ;;
        reload)
            check_config
            reload_services
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        logs)
            show_logs
            ;;
        logs-web)
            show_web_logs
            ;;
        logs-workers)
            show_worker_logs
            ;;
        logs-service)
            show_service_logs "$@"
            ;;
        start-service)
            check_config
            start_service "$@"
            ;;
        stop-service)
            check_config
            stop_service "$@"
            ;;
        restart-service)
            check_config
            restart_service "$@"
            ;;
        scale)
            check_config
            scale_service "$@"
            ;;
        monitor)
            open_monitor
            ;;
        flush)
            flush_logs
            ;;
        backup)
            backup_config
            ;;
        update)
            check_config
            update_app
            ;;
        delete)
            delete_services
            ;;
        setup)
            setup
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando inválido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal com argumentos
main "$@"