#!/bin/bash

# ===========================================
# Production-Ready VPS Deployment Script
# ===========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="mileage-app"
APP_PORT=4173
REPO_URL="https://github.com/ankithjoseph/nexusventures-mileage-form.git"
BACKUP_DIR="/opt/backups/mileage-app"

# Logging functions
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

# Error handling
error_exit() {
    log_error "$1"
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        error_exit "This script should not be run as root for security reasons"
    fi

    # Check available disk space (need at least 1GB)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then
        error_exit "Insufficient disk space. Need at least 1GB available."
    fi

    # Check if required commands exist
    command -v node >/dev/null 2>&1 || error_exit "Node.js is not installed"
    command -v npm >/dev/null 2>&1 || error_exit "npm is not installed"
    command -v git >/dev/null 2>&1 || error_exit "git is not installed"
    command -v pm2 >/dev/null 2>&1 || error_exit "PM2 is not installed"

    log_success "Pre-deployment checks passed"
}

# System update and dependencies
system_setup() {
    log_info "Updating system and installing dependencies..."

    # Update system
    sudo apt update && sudo apt upgrade -y

    # Install required packages
    sudo apt install -y curl wget gnupg2 software-properties-common build-essential

    # Install Node.js 20 if not present
    if ! command -v node &> /dev/null || [[ "$(node -v | cut -d'.' -f1)" != "v20" ]]; then
        log_info "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        sudo npm install -g pm2@latest
    fi

    log_success "System setup completed"
}

# Backup current deployment
create_backup() {
    log_info "Creating backup of current deployment..."

    sudo mkdir -p "$BACKUP_DIR"

    if [ -d "nexusventures-mileage-form" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r "nexusventures-mileage-form" "$BACKUP_DIR/$BACKUP_NAME"
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "No existing deployment found, skipping backup"
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."

    # Clone or update repository
    if [ ! -d "nexusventures-mileage-form" ]; then
        log_info "Cloning repository..."
        git clone "$REPO_URL" nexusventures-mileage-form
        cd nexusventures-mileage-form
    else
        log_info "Updating repository..."
        cd nexusventures-mileage-form
        git fetch origin
        git reset --hard origin/main
    fi

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false

    # Build application
    log_info "Building application..."
    npm run build

    # Install production dependencies only
    npm ci --production

    # Create logs directory
    mkdir -p logs

    log_success "Application deployed successfully"
}

# Configure PM2
configure_pm2() {
    log_info "Configuring PM2..."

    # Stop existing application
    pm2 stop "$APP_NAME" 2>/dev/null || true
    pm2 delete "$APP_NAME" 2>/dev/null || true

    # Start application with PM2
    pm2 start "npx serve dist -s -l $APP_PORT" --name "$APP_NAME"

    # Configure PM2 startup
    pm2 save
    pm2 startup systemd -u "$USER" --hp "$HOME" || true
    pm2 save

    log_success "PM2 configuration completed"
}

# Health check
health_check() {
    log_info "Performing health check..."

    # Wait for application to start
    sleep 10

    # Check if application is responding
    if curl -f "http://localhost:$APP_PORT" >/dev/null 2>&1; then
        log_success "Application is healthy and responding"
    else
        error_exit "Application health check failed"
    fi

    # Check PM2 status
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
        log_success "PM2 process is running"
    else
        error_exit "PM2 process is not running"
    fi
}

# Post-deployment cleanup
cleanup() {
    log_info "Performing cleanup..."

    # Remove old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        log_info "Old backups cleaned up"
    fi

    # Clear npm cache
    npm cache clean --force 2>/dev/null || true

    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "🚀 Starting production deployment..."

    pre_deployment_checks
    system_setup
    create_backup
    deploy_application
    configure_pm2
    health_check
    cleanup

    log_success "✅ Deployment completed successfully!"
    log_info "🌐 Your application is running on port $APP_PORT"
    log_info "📊 Check status: pm2 status"
    log_info "📝 View logs: pm2 logs $APP_NAME"
    log_info "🔄 Restart: pm2 restart $APP_NAME"
}

# Run main function
main "$@"
