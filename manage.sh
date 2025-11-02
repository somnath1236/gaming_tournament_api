#!/bin/bash

# ============================================
# Gaming Tournament Platform - Management Script
# Company: AMSIT (amsit.in)
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
show_banner() {
    clear
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║      🎮 Gaming Tournament Platform - Manager 🎮              ║"
    echo "║                                                               ║"
    echo "║                    By AMSIT (amsit.in)                        ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

# Success/Error messages
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if in project directory
check_directory() {
    if [ ! -f "supabase-backend/package.json" ]; then
        error "Please run this script from the project root directory"
        exit 1
    fi
}

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Installing now..."
        sudo npm install -g pm2
        if ! command -v pm2 &> /dev/null; then
            error "Failed to install PM2. Please install manually: npm install -g pm2"
            exit 1
        fi
        success "PM2 installed successfully!"
    fi
}

# Main menu
show_menu() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${YELLOW}   MAIN MENU${NC}"
    echo -e "${CYAN}============================================${NC}\n"
    
    echo "  1) Status          - Check service status"
    echo "  2) Start           - Start the service"
    echo "  3) Stop            - Stop the service"
    echo "  4) Restart         - Restart the service"
    echo "  5) Logs            - View logs (live)"
    echo "  6) Logs Tail       - Last 100 lines"
    echo "  7) Monitor         - Real-time monitoring"
    echo "  8) Update          - Pull & update code"
    echo "  9) Migrate DB      - Run database migration"
    echo " 10) Config          - Edit .env file"
    echo " 11) Backup          - Backup database"
    echo " 12) Health Check    - Test API health"
    echo " 13) Info            - System information"
    echo " 14) Clean           - Clean logs & cache"
    echo " 15) Help            - Show help"
    echo "  0) Exit"
    echo ""
    echo -e "${CYAN}============================================${NC}\n"
}

# Status
status_command() {
    echo -e "${CYAN}📊 Service Status${NC}\n"
    pm2 status gaming-tournament-api
    echo ""
    
    echo -e "${CYAN}🔗 Endpoints${NC}"
    echo "  Server: http://localhost:3000"
    echo "  Health: http://localhost:3000/health"
    echo "  API Info: http://localhost:3000/api-info"
    echo ""
}

# Start
start_command() {
    echo -e "${CYAN}🚀 Starting service...${NC}\n"
    
    cd supabase-backend
    
    if pm2 describe gaming-tournament-api &> /dev/null; then
        warning "Service already exists, restarting instead..."
        pm2 restart gaming-tournament-api
    else
        pm2 start src/server.js --name gaming-tournament-api
        pm2 save
    fi
    
    cd ..
    success "Service started!"
    sleep 2
    pm2 status gaming-tournament-api
}

# Stop
stop_command() {
    echo -e "${CYAN}⏹️  Stopping service...${NC}\n"
    pm2 stop gaming-tournament-api
    success "Service stopped!"
}

# Restart
restart_command() {
    echo -e "${CYAN}🔄 Restarting service...${NC}\n"
    pm2 restart gaming-tournament-api
    success "Service restarted!"
    sleep 2
    pm2 status gaming-tournament-api
}

# Logs
logs_command() {
    echo -e "${CYAN}📋 Viewing logs (Ctrl+C to exit)...${NC}\n"
    pm2 logs gaming-tournament-api
}

# Logs tail
logs_tail_command() {
    echo -e "${CYAN}📋 Last 100 lines of logs...${NC}\n"
    pm2 logs gaming-tournament-api --lines 100 --nostream
}

# Monitor
monitor_command() {
    echo -e "${CYAN}📊 Real-time monitoring (Ctrl+C to exit)...${NC}\n"
    pm2 monit gaming-tournament-api
}

# Update
update_command() {
    echo -e "${CYAN}🔄 Updating application...${NC}\n"
    
    warning "This will pull latest code and restart the service."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Update cancelled"
        return
    fi
    
    # Pull changes
    info "Pulling latest code..."
    git pull origin main || {
        error "Failed to pull code"
        return
    }
    success "Code updated!"
    
    # Install dependencies
    info "Installing dependencies..."
    cd supabase-backend
    npm install
    cd ..
    success "Dependencies installed!"
    
    # Restart
    info "Restarting service..."
    pm2 restart gaming-tournament-api
    success "Service restarted with new code!"
    
    # Show status
    sleep 2
    pm2 status gaming-tournament-api
}

# Migrate DB
migrate_command() {
    echo -e "${CYAN}🗄️  Database Migration${NC}\n"
    
    if ! command -v psql &> /dev/null; then
        error "psql not found"
        info "Use manual migration: See DEPLOY.md"
        return 1
    fi
    
    echo "Attempting automatic migration..."
    read -p "Supabase Host: " DB_HOST
    read -p "Database (default: postgres): " DB_NAME
    DB_NAME=${DB_NAME:-postgres}
    read -p "User (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Password: " DB_PASSWORD
    echo ""
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql -h "$DB_HOST" -p 5432 -U "$DB_USER" -d "$DB_NAME" -f supabase-migration.sql; then
        success "Migration completed!"
    else
        error "Migration failed. Use manual method instead."
        echo ""
        info "Manual method:"
        info "1. Open Supabase Dashboard"
        info "2. Go to SQL Editor"
        info "3. Run supabase-migration.sql"
    fi
    
    unset PGPASSWORD
}

# Config
config_command() {
    echo -e "${CYAN}⚙️  Configuration Editor${NC}\n"
    
    if [ ! -f "supabase-backend/.env" ]; then
        error ".env file not found"
        info "Run install.sh first to create configuration"
        return
    fi
    
    info "Opening .env file..."
    echo ""
    echo "Save and exit (Ctrl+X, then Y) when done"
    echo ""
    read -p "Press Enter to continue..."
    
    nano supabase-backend/.env
    
    warning "Environment changed! Restart service?"
    read -p "Restart now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 restart gaming-tournament-api
        success "Service restarted!"
    fi
}

# Backup
backup_command() {
    echo -e "${CYAN}💾 Database Backup${NC}\n"
    
    warning "Supabase manages backups automatically."
    info "This creates a local SQL export."
    
    read -p "Supabase Host: " DB_HOST
    read -sp "Password: " DB_PASSWORD
    echo ""
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if pg_dump -h "$DB_HOST" -p 5432 -U postgres postgres > "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
    else
        error "Backup failed"
    fi
    
    unset PGPASSWORD
}

# Health Check
health_command() {
    echo -e "${CYAN}🏥 Health Check${NC}\n"
    
    info "Checking localhost:3000..."
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
        success "API is healthy!"
        
        # Get JSON response
        echo ""
        info "Health details:"
        curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
    else
        error "API is down or not responding"
    fi
    echo ""
}

# Info
info_command() {
    echo -e "${CYAN}ℹ️  System Information${NC}\n"
    
    echo -e "${YELLOW}OS Information:${NC}"
    if [ -f /etc/os-release ]; then
        cat /etc/os-release | grep -E "^(NAME|VERSION)="
    fi
    echo ""
    
    echo -e "${YELLOW}Node.js:${NC}"
    node --version
    echo ""
    
    echo -e "${YELLOW}NPM:${NC}"
    npm --version
    echo ""
    
    echo -e "${YELLOW}PM2:${NC}"
    pm2 --version
    echo ""
    
    echo -e "${YELLOW}Memory Usage:${NC}"
    free -h
    echo ""
    
    echo -e "${YELLOW}Disk Usage:${NC}"
    df -h / | tail -1
    echo ""
}

# Clean
clean_command() {
    echo -e "${CYAN}🧹 Cleanup${NC}\n"
    
    warning "This will clean logs and temporary files."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    info "Cleaning PM2 logs..."
    pm2 flush
    success "Logs cleaned!"
    
    info "Removing node_modules cache..."
    cd supabase-backend
    rm -rf node_modules/.cache
    cd ..
    success "Cache cleaned!"
}

# Help
help_command() {
    echo -e "${CYAN}📚 Help & Documentation${NC}\n"
    
    echo -e "${YELLOW}Quick Links:${NC}"
    echo "  • README.md - Overview"
    echo "  • DEPLOY.md - Deployment guide"
    echo "  • API_DOCS.html - API documentation"
    echo "  • DEMO_ACCOUNTS.md - Test accounts"
    echo ""
    
    echo -e "${YELLOW}Common Tasks:${NC}"
    echo "  1. Check status: ./manage.sh"
    echo "  2. View logs: pm2 logs gaming-tournament-api"
    echo "  3. Restart: pm2 restart gaming-tournament-api"
    echo "  4. Update code: git pull && npm install && pm2 restart"
    echo ""
    
    echo -e "${YELLOW}Support:${NC}"
    echo "  Company: AMSIT"
    echo "  Website: amsit.in"
    echo "  Email: support@amsit.in"
    echo ""
}

# Main loop
main() {
    check_directory
    check_pm2
    
    while true; do
        show_banner
        show_menu
        
        read -p "Select option: " choice
        echo ""
        
        case $choice in
            1) status_command; read -p "Press Enter to continue..." ;;
            2) start_command; read -p "Press Enter to continue..." ;;
            3) stop_command; read -p "Press Enter to continue..." ;;
            4) restart_command; read -p "Press Enter to continue..." ;;
            5) logs_command; read -p "Press Enter to continue..." ;;
            6) logs_tail_command; read -p "Press Enter to continue..." ;;
            7) monitor_command; read -p "Press Enter to continue..." ;;
            8) update_command; read -p "Press Enter to continue..." ;;
            9) migrate_command; read -p "Press Enter to continue..." ;;
            10) config_command; read -p "Press Enter to continue..." ;;
            11) backup_command; read -p "Press Enter to continue..." ;;
            12) health_command; read -p "Press Enter to continue..." ;;
            13) info_command; read -p "Press Enter to continue..." ;;
            14) clean_command; read -p "Press Enter to continue..." ;;
            15) help_command; read -p "Press Enter to continue..." ;;
            0) echo -e "${GREEN}👋 Goodbye!${NC}"; exit 0 ;;
            *) error "Invalid option"; sleep 1 ;;
        esac
    done
}

# Run main
main

