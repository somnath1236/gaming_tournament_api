# 🚀 Install Right Now - After Git Clone

**You just did:** `git clone`

**Now follow these steps:**

---

## 📋 Step-by-Step Installation

### Step 1: Navigate to Project

```bash
cd gaming_tournament_api
```

---

### Step 2: Install Node.js Dependencies

```bash
cd supabase-backend
npm install
cd ..
```

**Wait for it to finish...** (takes 1-2 minutes)

---

### Step 3: Install PM2 Globally

```bash
npm install -g pm2
```

**This is the process manager that keeps your server running.**

---

### Step 4: Configure Environment Variables

```bash
cd supabase-backend
```

Create `.env` file:

```bash
nano .env
```

**OR on Windows:**

```bash
notepad .env
```

**Paste this (edit with your Supabase credentials):**

```env
NODE_ENV=development
PORT=3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

JWT_SECRET=generate_with_openssl_random_base64_64_here
ADMIN_JWT_SECRET=generate_another_random_secret_here
JWT_EXPIRES_IN=30m
ADMIN_JWT_EXPIRES_IN=60m
REFRESH_TOKEN_EXPIRES_IN=7d

ALLOWED_ORIGINS=*

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

REFERRAL_REWARD=100
```

**Generate secrets:**
```bash
openssl rand -base64 64
```

**Save and exit** (Ctrl+X, then Y if using nano)

---

### Step 5: Run Database Migration

**Option A: Automatic** (if you have psql):
```bash
cd ..
chmod +x install.sh
./install.sh  # Follow prompts
```

**Option B: Manual** (Recommended):
1. Open **Supabase Dashboard**: http://72.60.218.82:8000/project/default
2. Click **"SQL Editor"**
3. Click **"New Query"**
4. Open `supabase-migration.sql`
5. Copy **ALL** content
6. Paste in Supabase SQL Editor
7. Click **"Run"** ✅

**Wait for:**
```
✅ Database migration completed successfully!
✅ All 23 tables created with indexes
✅ Demo data inserted
```

---

### Step 6: Start the Server

**Option A: Using PM2** (Recommended for production):

```bash
cd supabase-backend
pm2 start src/server.js --name gaming-tournament-api
pm2 save
```

**Option B: Using manage.sh** (Easy way):

```bash
cd ..
chmod +x manage.sh
./manage.sh
# Select option 2 (Start)
```

**Option C: Manual start** (Testing only):

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
🌍 Environment: development
🔌 WebSockets: Enabled
========================================
```

---

### Step 7: Test It!

**Open new terminal/window:**

```bash
curl http://localhost:3000/health
```

**You should get:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected"
}
```

**Test Tournaments:**
```bash
curl http://localhost:3000/tournaments
```

---

## ✅ You're Done!

**Your server is running!**

**Access:**
- Server: http://localhost:3000
- Health: http://localhost:3000/health
- API Info: http://localhost:3000/api-info

---

## 📱 Demo Account

**Login:**
```bash
# First get init token
curl -X POST http://localhost:3000/auth/init \
  -H "Content-Type: application/json" \
  -d "{}"

# Then login (use init_token from above)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "gamer1@example.com",
    "password": "password123",
    "init_token": "YOUR_INIT_TOKEN"
  }'
```

---

## 🛠️ Manage Your Server

**If you used PM2:**

```bash
pm2 status                 # Check status
pm2 logs gaming-tournament-api  # View logs
pm2 restart gaming-tournament-api  # Restart
pm2 stop gaming-tournament-api  # Stop
```

**If you used manage.sh:**

```bash
./manage.sh
# Select option from menu
```

---

## 🎉 Ready!

**115 Endpoints working!**  
**All features operational!**  
**Demo data loaded!**

**Next:** Deploy to VPS (see `DEPLOY.md`)

