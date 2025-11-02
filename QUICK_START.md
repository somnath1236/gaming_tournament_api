# ⚡ Quick Start Guide

## 🚀 Get Your API Running in 5 Minutes!

---

## Step 1: Run Database Migration (2 minutes)

### Open Supabase:
🌐 **http://72.60.218.82:8000/project/default**

### In SQL Editor:
1. Click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy **ALL** content from `supabase-migration.sql`
4. Paste in editor
5. Click **"Run"** (green button) ✅

### Wait for Success:
```
✅ Database migration completed successfully!
✅ All 23 tables created with indexes
✅ Demo data inserted
```

---

## Step 2: Start Server (1 minute)

```bash
cd supabase-backend
node src/server.js
```

**You should see:**
```
========================================
  Gaming Tournament Platform API
========================================
📍 Server: http://localhost:3000
📚 Health: http://localhost:3000/health
```

---

## Step 3: Test It! (2 minutes)

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

### Test 2: Get Init Token
```bash
curl -X POST http://localhost:3000/auth/init \
  -H "Content-Type: application/json" \
  -d "{}"
```

### Test 3: Login as Demo User
```bash
# First, get init_token from above, then:
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "gamer1@example.com",
    "password": "password123",
    "init_token": "YOUR_INIT_TOKEN_HERE"
  }'
```

### Test 4: Get Tournaments
```bash
curl http://localhost:3000/tournaments
```

---

## ✅ Demo Credentials

**Users:**
- Email: `gamer1@example.com`
- Password: `password123`

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

See `DEMO_ACCOUNTS.md` for full list!

---

## 🎮 You're Ready!

**115 Endpoints** working!  
**Demo data** loaded!  
**Server** running!

---

**🎉 Happy Coding!**

