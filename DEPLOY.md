# 🚀 Production Deployment Guide

## For VPS Deployment on AlmaLinux

---

## 📋 Prerequisites

- AlmaLinux 8+ or RHEL 8+ or CentOS 8+
- Root/sudo access
- Domain name (optional, for SSL)
- Supabase account and credentials
- At least 2GB RAM
- 20GB disk space

---

## ⚡ Quick Installation

### Option 1: Automatic Installer (Recommended)

```bash
# Download the installer
curl -O https://raw.githubusercontent.com/YOUR_REPO/install.sh

# Make it executable
chmod +x install.sh

# Run the installer
./install.sh
```

**The installer will:**
- ✅ Detect your OS (AlmaLinux/RHEL/CentOS/Debian)
- ✅ Install Node.js 18+
- ✅ Install PostgreSQL client
- ✅ Install PM2 (process manager)
- ✅ Clone/update repository
- ✅ Setup environment variables
- ✅ Install dependencies
- ✅ Configure firewall
- ✅ Setup database migration
- ✅ Configure SSL (Let's Encrypt)
- ✅ Start the service

---

## 🔧 Manual Installation

### Step 1: Install System Dependencies

```bash
# Update system
sudo dnf update -y

# Install Node.js 18
sudo dnf module enable nodejs:18 -y
sudo dnf install -y nodejs npm

# Install PostgreSQL client
sudo dnf install -y postgresql

# Install Git
sudo dnf install -y git

# Install PM2
sudo npm install -g pm2

# Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/gaming_tournament_api.git
cd gaming_tournament_api
```

### Step 3: Install Application Dependencies

```bash
cd supabase-backend
npm install
```

### Step 4: Configure Environment

```bash
# Create .env file
nano .env
```

**Add your configuration:**

```env
# Environment
NODE_ENV=production
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secrets
JWT_SECRET=generate_random_secret_here
ADMIN_JWT_SECRET=generate_random_secret_here
JWT_EXPIRES_IN=30m
ADMIN_JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Referral
REFERRAL_REWARD=100
```

**Generate random secrets:**
```bash
openssl rand -base64 64
```

### Step 5: Setup Database

#### Automatic Migration (if you have psql access):

```bash
cd ..

# Export Supabase credentials
export PGPASSWORD="your_supabase_password"

# Run migration
psql -h db.xxx.supabase.co -p 5432 -U postgres -d postgres -f supabase-migration.sql

# Unset password
unset PGPASSWORD
```

#### Manual Migration (Recommended):

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Open `supabase-migration.sql`
4. Copy **ALL** content
5. Paste in SQL Editor
6. Click **"Run"** ✅

**See:** `MIGRATION_GUIDE.md` for detailed instructions

### Step 6: Start with PM2

```bash
cd supabase-backend

# Start the service
pm2 start src/server.js --name gaming-tournament-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy the command shown and run it
```

---

## 🌐 SSL Setup with Nginx

### Install Nginx and Certbot

```bash
# Install Nginx
sudo dnf install -y nginx

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Start and enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/gaming-api
```

**Add configuration:**

```nginx
server {
    listen 80;
    server_name api.amsit.in;  # Your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gaming-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Get SSL Certificate

```bash
# Get certificate
sudo certbot --nginx -d api.amsit.in --non-interactive --agree-tos --email admin@amsit.in --redirect

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Service Management

### Check Status

```bash
# PM2 status
pm2 status

# View logs
pm2 logs gaming-tournament-api

# Monitor
pm2 monit
```

### Restart Service

```bash
# Restart
pm2 restart gaming-tournament-api

# Reload (zero-downtime)
pm2 reload gaming-tournament-api

# Stop
pm2 stop gaming-tournament-api
```

### Auto-Start on Boot

```bash
# Save current processes
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions shown
```

---

## 🔄 Updating the Application

```bash
# Navigate to project
cd /path/to/gaming_tournament_api

# Pull latest changes
git pull origin main

# Install new dependencies
cd supabase-backend
npm install

# Restart service
pm2 restart gaming-tournament-api
```

---

## 📝 Database Migration

### When to Run Migration

- **Initial setup**: Run once to create all tables
- **After pulling updates**: Check if `supabase-migration.sql` changed
- **Adding new tables**: Update SQL file and run migration

### How to Run Migration

**The SQL is safe to run multiple times!**

See: `MIGRATION_GUIDE.md` for details

---

## 🛠️ Troubleshooting

### Service Won't Start

```bash
# Check logs
pm2 logs gaming-tournament-api --lines 50

# Check environment
pm2 env gaming-tournament-api

# Verify .env file
cat supabase-backend/.env
```

### Database Connection Issues

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your_anon_key"

# Check environment variables
cd supabase-backend
cat .env | grep SUPABASE
```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
nano supabase-backend/.env
# Change: PORT=3001
```

---

## 🔐 Security Checklist

- ✅ Firewall configured (port 3000, 443, 80 only)
- ✅ SSL certificate installed (Let's Encrypt)
- ✅ Environment variables secure (.env not in git)
- ✅ JWT secrets are random and strong
- ✅ Supabase RLS policies enabled
- ✅ Rate limiting configured
- ✅ CORS restricted to your domains
- ✅ PM2 process running as non-root user
- ✅ Automatic security updates enabled

---

## 📞 Support

**Company:** AMSIT  
**Website:** amsit.in  
**Email:** support@amsit.in

---

## 📚 Additional Resources

- `README.md` - Overview and quick start
- `QUICK_START.md` - 5-minute local setup
- `DEMO_ACCOUNTS.md` - Demo login credentials
- `MIGRATION_GUIDE.md` - Database migration safety
- `API_DOCS.html` - Complete API documentation
- `API_ENDPOINTS.json` - All endpoints reference

---

**🎉 Your Gaming Tournament Platform is production-ready!**

