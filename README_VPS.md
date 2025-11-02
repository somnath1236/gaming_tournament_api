# 🚀 VPS Installation - Quick Reference

**For AlmaLinux VPS (You're on this!)**

---

## ⚡ Quick Commands (Copy & Paste)

```bash
# 1. Install Node.js
sudo dnf update -y
sudo dnf install -y nodejs npm

# 2. Verify Node.js installed
node --version
npm --version

# 3. Go to project
cd gaming_tournament_api

# 4. Use the installer (RECOMMENDED)
chmod +x install.sh
./install.sh

# This will install everything automatically!
```

---

## 🔄 What install.sh Does

✅ Detects OS (AlmaLinux)  
✅ Installs Node.js 18  
✅ Installs PM2  
✅ Installs PostgreSQL client  
✅ Installs Git  
✅ Configures environment  
✅ Sets up database  
✅ Starts the service  

---

## 📝 Manual Installation

**If you prefer manual:**

```bash
# Install Node.js
sudo dnf install -y nodejs npm

# Go to project
cd gaming_tournament_api/supabase-backend

# Install dependencies
npm install

# Install PM2
npm install -g pm2

# Create .env file
nano .env
# (Add your Supabase credentials)

# Start server
pm2 start src/server.js --name gaming-tournament-api
```

---

## 🎯 After Installation

**Test it:**

```bash
curl http://localhost:3000/health
```

**Should return:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## 📚 More Help

- `INSTALL_NOW.md` - Detailed installation
- `DEPLOY.md` - Full VPS deployment
- `QUICK_FIX.md` - Common errors

---

**🎉 That's all you need!**


