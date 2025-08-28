#!/bin/bash

# Script para inicializar o Webhook Worker
# Uso: ./scripts/start-webhook-worker.sh [start|stop|restart|status]

set -e

# Configurações
WORKER_NAME="webhook-worker"
WORKER_SCRIPT="src/workers/webhook-worker.js"
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
        log_warning "Webhook Worker já está rodando (PID: $(cat $PID_FILE))"
        return 1
    fi

    log "Iniciando Webhook Worker..."
    
    # Criar diretório de logs se não existir
    mkdir -p logs
    
    # Carregar variáveis de ambiente
    if [ -f ".env.webhook-worker" ]; then
        log "Carregando configurações de .env.webhook-worker"
        export $(cat .env.webhook-worker | grep -v '^#' | xargs)
    elif [ -f ".env" ]; then
        log "Carregando configurações de .env"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Iniciar worker em background
    nohup node "$WORKER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Salvar PID
    echo $pid > "$PID_FILE"
    
    # Verificar se iniciou corretamente
    sleep 2
    if is_running; then
        log_success "Webhook Worker iniciado com sucesso (PID: $pid)"
        log "Logs disponíveis em: $LOG_FILE"
    else
        log_error "Falha ao iniciar Webhook Worker"
        return 1
    fi
}

# Parar o worker
stop_worker() {
    if ! is_running; then
        log_warning "Webhook Worker não está rodando"
        return 1
    fi

    local pid=$(cat "$PID_FILE")
    log "Parando Webhook Worker (PID: $pid)..."
    
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
        log_success "Webhook Worker parado com sucesso"
    else
        log_error "Falha ao parar Webhook Worker"
        return 1
    fi
}

# Reiniciar o worker
restart_worker() {
    log "Reiniciando Webhook Worker..."
    stop_worker || true
    sleep 2
    start_worker
}

# Verificar status do worker
status_worker() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_success "Webhook Worker está rodando (PID: $pid)"
        
        # Mostrar informações do processo
        if command -v ps > /dev/null; then
            echo
            ps -p "$pid" -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || true
        fi
        
        # Mostrar últimas linhas do log
        if [ -f "$LOG_FILE" ]; then
            echo
            log "Últimas 10 linhas do log:"
            tail -n 10 "$LOG_FILE" 2>/dev/null || true
        fi
    else
        log_warning "Webhook Worker não está rodando"
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

# Função de ajuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo
    echo "Comandos disponíveis:"
    echo "  start     Iniciar o Webhook Worker"
    echo "  stop      Parar o Webhook Worker"
    echo "  restart   Reiniciar o Webhook Worker"
    echo "  status    Verificar status do Webhook Worker"
    echo "  logs      Mostrar logs em tempo real"
    echo "  help      Mostrar esta ajuda"
    echo
}

# Verificar se está no diretório correto
if [ ! -f "$WORKER_SCRIPT" ]; then
    log_error "Script do worker não encontrado: $WORKER_SCRIPT"
    log_error "Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Processar comando
case "${1:-help}" in
    start)
        start_worker
        ;;
    stop)
        stop_worker
        ;;
    restart)
        restart_worker
        ;;
    status)
        status_worker
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando inválido: $1"
        echo
        show_help
        exit 1
        ;;
esac