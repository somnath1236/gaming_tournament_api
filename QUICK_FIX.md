# ⚡ Quick Fix Guide

## PM2 Not Installed Error

**Error:** `pm2: command not found`

**Problem:** PM2 (Process Manager 2) is not installed on your system.

---

## 🔧 Immediate Fix

### Windows (You're on Windows)

Run this command:

```bash
npm install -g pm2
```

Then restart `manage.sh`:

```bash
./manage.sh
```

---

## ✅ Already Fixed

I've updated `manage.sh` to automatically check and install PM2 if missing.

**Next time you run it, it will auto-fix this!**

---

## 📝 What is PM2?

PM2 is a process manager for Node.js applications that keeps your server running:
- ✅ Auto-restart if crashes
- ✅ Keep running after terminal closes
- ✅ Load balancing
- ✅ Monitoring & logs

---

## 🎯 Alternative: Manual Start (Without PM2)

If you just want to test the server:

```bash
cd supabase-backend
node src/server.js
```

**Note:** This will stop when you close terminal. Use PM2 for production!

---

## ✅ Done!

After installing PM2, run `./manage.sh` again!

