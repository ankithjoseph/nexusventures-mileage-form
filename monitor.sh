#!/bin/bash

# ===========================================
# Production Monitoring Script
# ===========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="mileage-app"
APP_PORT=3001
LOG_FILE="logs/monitoring.log"
HEALTH_ENDPOINT="http://localhost:$APP_PORT"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check application health
check_health() {
    if curl -f --max-time 10 "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Application is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} Application is not responding"
        return 1
    fi
}

# Check PM2 process
check_pm2() {
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PM2 process is running"
        return 0
    else
        echo -e "${RED}✗${NC} PM2 process is not running"
        return 1
    fi
}

# Check system resources
check_resources() {
    echo "System Resources:"

    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    echo "  CPU Usage: ${CPU_USAGE}%"

    # Memory usage
    MEM_INFO=$(free | grep Mem)
    MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
    MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
    MEM_PERCENTAGE=$((MEM_USED * 100 / MEM_TOTAL))
    echo "  Memory Usage: ${MEM_PERCENTAGE}% (${MEM_USED}KB / ${MEM_TOTAL}KB)"

    # Disk usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo "  Disk Usage: ${DISK_USAGE}%"
}

# Check application logs
check_logs() {
    echo "Recent Application Logs:"
    pm2 logs "$APP_NAME" --lines 10 --nostream 2>/dev/null || echo "No logs available"
}

# Main monitoring function
main() {
    echo "========================================"
    echo "🩺 Production Monitoring Report"
    echo "========================================"

    log "Starting monitoring check..."

    # Health checks
    echo "Health Checks:"
    check_health
    HEALTH_STATUS=$?

    check_pm2
    PM2_STATUS=$?

    echo

    # System resources
    check_resources
    echo

    # Application logs (only if there are issues)
    if [ $HEALTH_STATUS -ne 0 ] || [ $PM2_STATUS -ne 0 ]; then
        echo "Application Logs (last 10 lines):"
        check_logs
        echo

        # Attempt auto-recovery
        echo "Attempting auto-recovery..."
        if [ $PM2_STATUS -ne 0 ]; then
            log "Restarting PM2 process..."
            pm2 restart "$APP_NAME"
            sleep 5
            check_pm2
        fi
    fi

    echo "========================================"

    # Exit with appropriate code
    if [ $HEALTH_STATUS -eq 0 ] && [ $PM2_STATUS -eq 0 ]; then
        log "✅ All checks passed"
        exit 0
    else
        log "❌ Issues detected - manual intervention may be required"
        exit 1
    fi
}

# Run monitoring
main "$@"