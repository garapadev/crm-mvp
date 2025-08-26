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
    echo "  start     - Iniciar todos os serviços"
    echo "  stop      - Parar todos os serviços"
    echo "  restart   - Reiniciar todos os serviços"
    echo "  reload    - Recarregar todos os serviços (zero downtime)"
    echo "  status    - Mostrar status dos serviços"
    echo "  logs      - Mostrar logs em tempo real"
    echo "  logs-web  - Mostrar logs apenas do serviço web"
    echo "  monitor   - Abrir monitor PM2"
    echo "  delete    - Remover todos os serviços"
    echo "  setup     - Configuração inicial"
    echo "  help      - Mostrar esta ajuda"
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
        logs)
            show_logs
            ;;
        logs-web)
            show_web_logs
            ;;
        monitor)
            open_monitor
            ;;
        delete)
            delete_services
            ;;
        setup)
            setup
            ;;
        help|--help|-h)
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