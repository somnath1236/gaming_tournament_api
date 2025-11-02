# ⚡ Quick Fix: Install Node.js on AlmaLinux VPS

**Error:** `npm: command not found`

**Problem:** Node.js is not installed on your VPS.

---

## 🔧 Fix This NOW

### For AlmaLinux/RHEL/CentOS (You're on this):

Run these commands **one by one**:

```bash
# 1. Update system
sudo dnf update -y

# 2. Install Node.js 18
sudo dnf install -y nodejs npm

# 3. Verify installation
node --version
npm --version

# You should see:
# v18.x.x
# 9.x.x
```

---

## ✅ Alternative: Install Latest Node.js

If above doesn't install Node 18:

```bash
# 1. Enable Node.js 18 module
sudo dnf module enable nodejs:18 -y

# 2. Install Node.js 18
sudo dnf install -y nodejs npm

# 3. Verify
node --version
```

---

## 🚀 After Node.js is Installed

**Now you can run:**

```bash
# 1. Go to project directory
cd gaming_tournament_api

# 2. Install dependencies
cd supabase-backend
npm install

# 3. Install PM2
npm install -g pm2

# 4. Start server
pm2 start src/server.js --name gaming-tournament-api
```

---

## 🎯 OR Use the Auto-Installer

**Better option - Run the installer:**

```bash
cd gaming_tournament_api

# Make installer executable
chmod +x install.sh

# Run installer (it will auto-install Node.js!)
./install.sh
```

**This will:**
- ✅ Auto-detect AlmaLinux
- ✅ Install Node.js 18
- ✅ Install all dependencies
- ✅ Configure everything
- ✅ Start the service

---

## ⚠️ Important

**Run as regular user, NOT root:**
```bash
# Don't run as root
su - your_username

# Then run commands
```

---

## ✅ Quick Test

After installation:

```bash
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x
```

**If both work, Node.js is installed!**

---

**🎉 That's it! Run the installer or npm install now!**


