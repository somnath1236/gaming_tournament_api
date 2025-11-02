#!/bin/bash

# ============================================
# Gaming Tournament Platform - Auto Installer
# Company: AMSIT (amsit.in)
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
banner() {
    clear
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║   🎮 Gaming Tournament Platform - Production Installer 🎮   ║"
    echo "║                                                               ║"
    echo "║                    By AMSIT (amsit.in)                       ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

# Print colored messages
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "${CYAN}🔧 $1${NC}"; }

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        print_error "Please DO NOT run this script as root/sudo"
        print_info "The script will prompt for sudo when needed"
        exit 1
    fi
}

# Check operating system
check_os() {
    print_step "Checking operating system..."
    
    if [ -f /etc/redhat-release ]; then
        OS="rhel"
        OS_VERSION=$(cat /etc/redhat-release)
        print_success "Detected: $OS_VERSION"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        OS_VERSION=$(cat /etc/debian_version)
        print_success "Detected: Debian $OS_VERSION"
    elif [ -f /etc/centos-release ]; then
        OS="centos"
        OS_VERSION=$(cat /etc/centos-release)
        print_success "Detected: $OS_VERSION"
    else
        OS="unknown"
        print_error "Unknown operating system"
        exit 1
    fi
}

# Install Node.js
install_nodejs() {
    print_step "Installing Node.js 18.x..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js already installed: $NODE_VERSION"
        
        # Check if version is >= 18
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "Node.js version is sufficient"
            return 0
        fi
    fi
    
    # Install Node.js based on OS
    if [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        print_info "Installing Node.js for RHEL/CentOS/AlmaLinux..."
        sudo dnf module enable nodejs:18 -y || true
        sudo dnf install -y nodejs npm
    elif [ "$OS" = "debian" ]; then
        print_info "Installing Node.js for Debian/Ubuntu..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Verify installation
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed successfully: $NODE_VERSION"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

# Install PostgreSQL Client (for Supabase)
install_postgresql_client() {
    print_step "Installing PostgreSQL client..."
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL client already installed"
        return 0
    fi
    
    if [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        sudo dnf install -y postgresql
    elif [ "$OS" = "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y postgresql-client
    fi
    
    print_success "PostgreSQL client installed"
}

# Install Git
install_git() {
    print_step "Installing Git..."
    
    if command -v git &> /dev/null; then
        print_success "Git already installed"
        return 0
    fi
    
    if [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
        sudo dnf install -y git
    elif [ "$OS" = "debian" ]; then
        sudo apt-get install -y git
    fi
    
    print_success "Git installed"
}

# Install PM2 for process management
install_pm2() {
    print_step "Installing PM2 process manager..."
    
    if command -v pm2 &> /dev/null; then
        print_success "PM2 already installed"
        return 0
    fi
    
    sudo npm install -g pm2
    print_success "PM2 installed"
}

# Setup firewall
setup_firewall() {
    print_step "Configuring firewall..."
    
    if command -v firewall-cmd &> /dev/null; then
        # RHEL/CentOS/AlmaLinux firewall
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --reload
        print_success "Firewall configured (firewalld)"
    elif command -v ufw &> /dev/null; then
        # Debian/Ubuntu firewall
        sudo ufw allow 3000/tcp
        sudo ufw allow 22/tcp
        print_success "Firewall configured (ufw)"
    else
        print_warning "No firewall detected, skipping configuration"
    fi
}

# Clone or update repository
setup_repository() {
    print_step "Setting up repository..."
    
    if [ -d "gaming_tournament_api" ]; then
        print_info "Repository exists, updating..."
        cd gaming_tournament_api
        git pull origin main || print_warning "Could not pull, continuing..."
    else
        print_info "Cloning repository..."
        git clone https://github.com/YOUR_GITHUB_USERNAME/gaming_tournament_api.git || {
            print_error "Failed to clone repository"
            print_info "Please clone the repository manually first"
            exit 1
        }
        cd gaming_tournament_api
    fi
    
    print_success "Repository ready"
}

# Setup environment variables
setup_environment() {
    print_step "Configuring environment variables..."
    
    cd supabase-backend
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return 0
        fi
    fi
    
    echo -e "${CYAN}"
    echo "=========================================="
    echo "  Environment Configuration"
    echo "=========================================="
    echo -e "${NC}"
    
    # Get Supabase URL
    echo -e "${YELLOW}Supabase Configuration:${NC}"
    read -p "Supabase URL (e.g., https://xxx.supabase.co): " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    
    # Generate JWT secrets
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    ADMIN_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    # Server configuration
    echo -e "${YELLOW}Server Configuration:${NC}"
    read -p "Server Port (default: 3000): " SERVER_PORT
    SERVER_PORT=${SERVER_PORT:-3000}
    
    read -p "Allowed Origins (default: *): " ALLOWED_ORIGINS
    ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}
    
    # Create .env file
    cat > .env << EOF
# ============================================
# Gaming Tournament Platform Configuration
# Company: AMSIT (amsit.in)
# ============================================

# Environment
NODE_ENV=production
APP_VERSION=1.0.0
PORT=${SERVER_PORT}

# Supabase Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
JWT_EXPIRES_IN=30m
ADMIN_JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Referral Bonus
REFERRAL_REWARD=100

# Server Configuration
APP_VERSION=1.0.0
EOF
    
    print_success "Environment configured"
    print_warning ".env file created with sensitive credentials. Keep it secure!"
}

# Install dependencies
install_dependencies() {
    print_step "Installing Node.js dependencies..."
    
    cd supabase-backend
    
    if [ -d "node_modules" ]; then
        print_info "Dependencies exist, updating..."
        npm update
    else
        print_info "Installing dependencies..."
        npm install
    fi
    
    print_success "Dependencies installed"
}

# Setup database
setup_database() {
    print_step "Database setup..."
    
    echo -e "${CYAN}"
    echo "=========================================="
    echo "  Database Migration"
    echo "=========================================="
    echo -e "${NC}"
    
    echo "You have two options:"
    echo "1) Automatic migration (requires psql with Supabase connection)"
    echo "2) Manual migration (copy SQL to Supabase SQL Editor)"
    echo ""
    read -p "Choose option (1 or 2, default: 2): " MIGRATION_OPTION
    MIGRATION_OPTION=${MIGRATION_OPTION:-2}
    
    if [ "$MIGRATION_OPTION" = "1" ]; then
        automatic_migration
    else
        manual_migration_instructions
    fi
}

# Automatic database migration
automatic_migration() {
    print_step "Attempting automatic database migration..."
    
    if ! command -v psql &> /dev/null; then
        print_error "psql not found. Please install PostgreSQL client first"
        manual_migration_instructions
        return 1
    fi
    
    read -p "Supabase Host (e.g., db.xxx.supabase.co): " DB_HOST
    read -p "Supabase Port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name (default: postgres): " DB_NAME
    DB_NAME=${DB_NAME:-postgres}
    read -p "Database User (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -sp "Database Password: " DB_PASSWORD
    echo ""
    
    # Export password for psql
    export PGPASSWORD="$DB_PASSWORD"
    
    # Try to run migration
    cd ..
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f supabase-migration.sql; then
        print_success "Database migration completed automatically"
    else
        print_error "Automatic migration failed"
        manual_migration_instructions
    fi
    
    unset PGPASSWORD
}

# Manual migration instructions
manual_migration_instructions() {
    echo -e "${CYAN}"
    echo "=========================================="
    echo "  Manual Database Migration"
    echo "=========================================="
    echo -e "${NC}"
    
    print_info "To migrate your database manually:"
    echo ""
    echo "1. Open your Supabase Dashboard"
    echo "2. Go to SQL Editor"
    echo "3. Click 'New Query'"
    echo "4. Open the file: supabase-migration.sql"
    echo "5. Copy ALL content"
    echo "6. Paste in SQL Editor"
    echo "7. Click 'Run'"
    echo ""
    print_warning "Please run the migration now, then press Enter to continue..."
    read -p "Press Enter after running the migration..."
}

# Setup PM2 process
setup_pm2() {
    print_step "Setting up PM2 process..."
    
    cd supabase-backend
    
    # Check if process already exists
    if pm2 describe gaming-tournament-api &> /dev/null; then
        print_info "Stopping existing process..."
        pm2 stop gaming-tournament-api
        pm2 delete gaming-tournament-api
    fi
    
    # Start new process
    pm2 start src/server.js --name gaming-tournament-api
    pm2 save
    pm2 startup
    
    print_success "PM2 process configured"
}

# Install SSL with Let's Encrypt
install_ssl() {
    print_step "SSL Configuration..."
    
    read -p "Do you want to setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping SSL setup"
        return 0
    fi
    
    if ! command -v certbot &> /dev/null; then
        print_info "Installing certbot..."
        if [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
            sudo dnf install -y certbot python3-certbot-nginx
        elif [ "$OS" = "debian" ]; then
            sudo apt-get install -y certbot python3-certbot-nginx
        fi
    fi
    
    read -p "Enter your domain name (e.g., api.amsit.in): " DOMAIN_NAME
    
    # Setup Nginx first if not installed
    if ! command -v nginx &> /dev/null; then
        print_info "Installing Nginx..."
        if [ "$OS" = "rhel" ] || [ "$OS" = "centos" ]; then
            sudo dnf install -y nginx
        elif [ "$OS" = "debian" ]; then
            sudo apt-get install -y nginx
        fi
        sudo systemctl enable nginx
        sudo systemctl start nginx
    fi
    
    # Create Nginx config
    sudo bash -c "cat > /etc/nginx/sites-available/gaming-api << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF"
    
    sudo ln -sf /etc/nginx/sites-available/gaming-api /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Get SSL certificate
    sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email admin@amsit.in --redirect
    
    print_success "SSL configured for $DOMAIN_NAME"
}

# Post-installation instructions
post_install() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║              🎉 Installation Complete! 🎉                     ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    print_success "Gaming Tournament Platform installed successfully!"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${YELLOW}📊 Service Status:${NC}"
    pm2 list
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${YELLOW}🔗 Quick Links:${NC}"
    print_info "Server: http://localhost:3000"
    print_info "Health: http://localhost:3000/health"
    print_info "API Docs: http://localhost:3000/api-info"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${YELLOW}📝 Useful Commands:${NC}"
    echo ""
    echo "  PM2 Management:"
    echo "    pm2 status                 - Check status"
    echo "    pm2 logs gaming-tournament-api - View logs"
    echo "    pm2 restart gaming-tournament-api - Restart"
    echo "    pm2 stop gaming-tournament-api - Stop"
    echo ""
    echo "  Database:"
    echo "    See supabase-migration.sql for SQL"
    echo ""
    echo "  Configuration:"
    echo "    nano supabase-backend/.env  - Edit config"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${YELLOW}📚 Documentation:${NC}"
    print_info "Read: README.md"
    print_info "Demo accounts: DEMO_ACCOUNTS.md"
    print_info "Migration guide: MIGRATION_GUIDE.md"
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${PURPLE}Made with ❤️  by AMSIT (amsit.in)${NC}"
    echo ""
}

# Main installation flow
main() {
    banner
    check_root
    check_os
    
    print_info "Starting installation for AMSIT Gaming Tournament Platform"
    echo ""
    
    install_nodejs
    install_postgresql_client
    install_git
    install_pm2
    setup_firewall
    setup_repository
    setup_environment
    install_dependencies
    setup_database
    setup_pm2
    install_ssl
    post_install
}

# Run main function
main

