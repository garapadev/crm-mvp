#!/bin/bash

# Script para inicializar o Email Sync Worker
# Uso: ./scripts/start-email-worker.sh [start|stop|restart|status]

set -e

# Configurações
WORKER_NAME="email-sync-worker"
WORKER_SCRIPT="src/workers/email-sync-worker.js"
PID_FILE="/tmp/${WORKER_NAME}.pid"
LOG_FILE="logs/${WORKER_NAME}.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Verificar se o worker está rodando
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Iniciar o worker
start_worker() {
    if is_running; then
        log_warning "Email Sync Worker já está rodando (PID: $(cat $PID_FILE))"
        return 1
    fi

    log "Iniciando Email Sync Worker..."
    
    # Criar diretório de logs se não existir
    mkdir -p logs
    
    # Carregar variáveis de ambiente
    if [ -f ".env.email-worker" ]; then
        log "Carregando configurações de .env.email-worker"
        set -a
        source .env.email-worker
        set +a
    elif [ -f ".env" ]; then
        log "Carregando configurações de .env"
        set -a
        source .env
        set +a
    fi
    
    # Iniciar worker em background
    nohup node "$WORKER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Salvar PID
    echo $pid > "$PID_FILE"
    
    # Verificar se iniciou corretamente
    sleep 2
    if is_running; then
        log_success "Email Sync Worker iniciado com sucesso (PID: $pid)"
        log "Logs disponíveis em: $LOG_FILE"
    else
        log_error "Falha ao iniciar Email Sync Worker"
        return 1
    fi
}

# Parar o worker
stop_worker() {
    if ! is_running; then
        log_warning "Email Sync Worker não está rodando"
        return 1
    fi

    local pid=$(cat "$PID_FILE")
    log "Parando Email Sync Worker (PID: $pid)..."
    
    # Tentar parar graciosamente
    kill -TERM "$pid" 2>/dev/null || true
    
    # Aguardar até 10 segundos
    local count=0
    while [ $count -lt 10 ] && is_running; do
        sleep 1
        count=$((count + 1))
    done
    
    # Se ainda estiver rodando, forçar parada
    if is_running; then
        log_warning "Forçando parada do worker..."
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Remover arquivo PID
    rm -f "$PID_FILE"
    
    if ! is_running; then
        log_success "Email Sync Worker parado com sucesso"
    else
        log_error "Falha ao parar Email Sync Worker"
        return 1
    fi
}

# Reiniciar o worker
restart_worker() {
    log "Reiniciando Email Sync Worker..."
    stop_worker || true
    sleep 2
    start_worker
}

# Status do worker
status_worker() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_success "Email Sync Worker está rodando (PID: $pid)"
        
        # Mostrar informações do processo
        if command -v ps > /dev/null; then
            echo ""
            log "Informações do processo:"
            ps -p "$pid" -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || true
        fi
        
        # Mostrar últimas linhas do log
        if [ -f "$LOG_FILE" ]; then
            echo ""
            log "Últimas 10 linhas do log:"
            tail -n 10 "$LOG_FILE" 2>/dev/null || true
        fi
    else
        log_warning "Email Sync Worker não está rodando"
        return 1
    fi
}

# Mostrar logs em tempo real
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        log "Mostrando logs em tempo real (Ctrl+C para sair):"
        tail -f "$LOG_FILE"
    else
        log_error "Arquivo de log não encontrado: $LOG_FILE"
        return 1
    fi
}

# Função principal
main() {
    case "${1:-status}" in
        "start")
            start_worker
            ;;
        "stop")
            stop_worker
            ;;
        "restart")
            restart_worker
            ;;
        "status")
            status_worker
            ;;
        "logs")
            show_logs
            ;;
        "help")
            echo "Uso: $0 [start|stop|restart|status|logs|help]"
            echo ""
            echo "Comandos:"
            echo "  start    - Iniciar o Email Sync Worker"
            echo "  stop     - Parar o Email Sync Worker"
            echo "  restart  - Reiniciar o Email Sync Worker"
            echo "  status   - Mostrar status do worker"
            echo "  logs     - Mostrar logs em tempo real"
            echo "  help     - Mostrar esta ajuda"
            ;;
        *)
            log_error "Comando inválido: $1"
            echo "Use '$0 help' para ver os comandos disponíveis"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"