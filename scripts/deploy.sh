#!/bin/bash

# CRM MVP Deploy Script
# Usage: ./scripts/deploy.sh [environment] [action]
# Environments: development, staging, production
# Actions: setup, deploy, rollback, status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="crm-mvp"
APP_DIR="/opt/gdev/crm-mvp"
BACKUP_DIR="/var/backups/crm-mvp"
LOG_DIR="/var/log/crm-mvp"
UPLOAD_DIR="/var/uploads/crm-mvp"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL client is not installed"
        exit 1
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        log_error "Redis client is not installed"
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing..."
        npm install -g pm2
    fi
    
    log_success "All requirements met"
}

setup_directories() {
    log_info "Setting up directories..."
    
    # Create necessary directories
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$LOG_DIR"
    sudo mkdir -p "$UPLOAD_DIR"
    
    # Set permissions
    sudo chown -R $USER:$USER "$BACKUP_DIR"
    sudo chown -R $USER:$USER "$LOG_DIR"
    sudo chown -R $USER:$USER "$UPLOAD_DIR"
    
    log_success "Directories created successfully"
}

setup_environment() {
    local env=$1
    log_info "Setting up $env environment..."
    
    case $env in
        "development")
            if [ ! -f ".env" ]; then
                log_info "Creating development .env file..."
                cp .env.example .env 2>/dev/null || log_warning "No .env.example found"
            fi
            ;;
        "staging")
            if [ ! -f ".env.staging" ]; then
                log_error ".env.staging file not found. Please create it first."
                exit 1
            fi
            log_info "Copying staging environment file..."
            cp .env.staging .env
            ;;
        "production")
            if [ ! -f ".env.production" ]; then
                log_error ".env.production file not found. Please create it first."
                exit 1
            fi
            log_info "Copying production environment file..."
            cp .env.production .env
            ;;
        *)
            log_error "Invalid environment: $env"
            exit 1
            ;;
    esac
    
    log_success "Environment $env configured"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm ci --production
    
    log_success "Dependencies installed"
}

build_application() {
    log_info "Building application..."
    
    # Build Next.js application
    npm run build
    
    if [ ! -d ".next" ]; then
        log_error "Build failed - .next directory not found"
        exit 1
    fi
    
    log_success "Application built successfully"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Check database connection
    if ! npm run db:status &> /dev/null; then
        log_error "Cannot connect to database"
        exit 1
    fi
    
    # Run migrations
    npm run db:migrate
    
    log_success "Database migrations completed"
}

backup_database() {
    log_info "Creating database backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/db_backup_$timestamp.sql"
    
    # Extract database URL components
    if [ -z "$DATABASE_URL" ]; then
        source .env
    fi
    
    # Create backup
    pg_dump "$DATABASE_URL" > "$backup_file"
    gzip "$backup_file"
    
    log_success "Database backup created: $backup_file.gz"
}

start_services() {
    log_info "Starting services..."
    
    # Start main application with PM2
    pm2 start ecosystem.config.js
    
    # Start workers
    ./scripts/start-webhook-worker.sh start
    ./scripts/start-email-worker.sh start
    
    # Save PM2 configuration
    pm2 save
    
    log_success "Services started"
}

stop_services() {
    log_info "Stopping services..."
    
    # Stop workers
    ./scripts/start-webhook-worker.sh stop || true
    ./scripts/start-email-worker.sh stop || true
    
    # Stop PM2 processes
    pm2 stop all || true
    
    log_success "Services stopped"
}

restart_services() {
    log_info "Restarting services..."
    
    stop_services
    sleep 5
    start_services
    
    log_success "Services restarted"
}

check_health() {
    log_info "Checking application health..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "Application is healthy"
    else
        log_error "Application health check failed"
        return 1
    fi
    
    # Check workers
    if ./scripts/start-webhook-worker.sh status &> /dev/null; then
        log_success "Webhook worker is running"
    else
        log_warning "Webhook worker is not running"
    fi
    
    if ./scripts/start-email-worker.sh status &> /dev/null; then
        log_success "Email worker is running"
    else
        log_warning "Email worker is not running"
    fi
}

show_status() {
    log_info "System Status:"
    
    echo "PM2 Processes:"
    pm2 status
    
    echo "\nWorker Status:"
    ./scripts/start-webhook-worker.sh status || echo "Webhook worker: STOPPED"
    ./scripts/start-email-worker.sh status || echo "Email worker: STOPPED"
    
    echo "\nSystem Services:"
    systemctl is-active postgresql || echo "PostgreSQL: INACTIVE"
    systemctl is-active redis || echo "Redis: INACTIVE"
    systemctl is-active nginx || echo "Nginx: INACTIVE"
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Setup PM2 monitoring
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    
    # Setup logrotate for application logs
    sudo tee /etc/logrotate.d/crm-mvp > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
    
    log_success "Monitoring configured"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Remove backups older than 30 days
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
    
    log_success "Old backups cleaned up"
}

# Main deployment function
deploy() {
    local env=$1
    
    log_info "Starting deployment for $env environment..."
    
    # Pre-deployment checks
    check_requirements
    
    # Backup current state
    backup_database
    
    # Setup environment
    setup_environment "$env"
    
    # Install dependencies and build
    install_dependencies
    build_application
    
    # Database operations
    run_database_migrations
    
    # Restart services
    restart_services
    
    # Health check
    if check_health; then
        log_success "Deployment completed successfully!"
    else
        log_error "Deployment completed but health checks failed"
        exit 1
    fi
    
    # Cleanup
    cleanup_old_backups
}

# Setup function
setup() {
    local env=$1
    
    log_info "Setting up CRM MVP for $env environment..."
    
    check_requirements
    setup_directories
    setup_environment "$env"
    install_dependencies
    build_application
    run_database_migrations
    setup_monitoring
    start_services
    check_health
    
    log_success "Setup completed successfully!"
}

# Rollback function
rollback() {
    log_info "Rolling back to previous version..."
    
    # Find latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql.gz | head -n1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to backup: $latest_backup"
    
    # Stop services
    stop_services
    
    # Restore database
    gunzip -c "$latest_backup" | psql "$DATABASE_URL"
    
    # Start services
    start_services
    
    log_success "Rollback completed"
}

# Main script logic
ENVIRONMENT=${1:-development}
ACTION=${2:-deploy}

case $ACTION in
    "setup")
        setup "$ENVIRONMENT"
        ;;
    "deploy")
        deploy "$ENVIRONMENT"
        ;;
    "rollback")
        rollback
        ;;
    "status")
        show_status
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 [environment] [action]"
        echo "Environments: development, staging, production"
        echo "Actions: setup, deploy, rollback, status, start, stop, restart, health"
        exit 1
        ;;
esac