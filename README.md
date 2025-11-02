# 🎮 Gaming Tournament Platform API

**Company:** AMSIT (amsit.in)  
**Version:** 1.0.0  
**License:** MIT

**Complete Node.js + Supabase Backend - 115 Endpoints**

---

## ✅ Status

**SERVER IS RUNNING!** ✅  
**http://localhost:3000**

---

## ⚠️ CRITICAL: Run Database Migration

Your server is running but **database tables are missing**!

### Quick Steps

1. Open: **http://72.60.218.82:8000/project/default**
2. Click: **SQL Editor** (left sidebar)
3. Copy: All code from `supabase-migration.sql`
4. Paste: In SQL Editor
5. Run: Click green **"Run"** button
6. Wait: For success message ✅

**After this, all 115 endpoints will work!**

---

## 📊 What's Built

- ✅ **115 Endpoints** (application + admin + WebSocket)
- ✅ **Node.js + Express + Supabase**
- ✅ **JWT Authentication** (user & admin)
- ✅ **Init Token Security** (app-level protection)
- ✅ **WebSocket** real-time support
- ✅ **Production Ready** (VPS deployment ready)

---

## 🧪 Test Endpoints

```bash
# Health check (works now)
curl http://localhost:3000/health

# View ALL 113 endpoints
curl http://localhost:3000/api-info

# Tournaments (works after migration)
curl http://localhost:3000/tournaments

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone_number": "+911234567890",
    "full_name": "Test User",
    "in_game_name": "Tester",
    "primary_game": "BGMI",
    "password": "password123"
  }'
```

**🔥 NEW:** `/api-info` endpoint shows complete list of all endpoints!

---

## 📖 All Endpoints

**See:** `API_ENDPOINTS.json` for complete list of all 113 endpoints

---

## 🚀 Start Server

```bash
cd supabase-backend
npm install  # First time only
node src/server.js
```

Or for development with auto-reload:
```bash
npm run dev
```

---

## 📁 Project Structure

```
gaming_tournament_api/
├── supabase-backend/          # Node.js backend
│   ├── src/
│   │   ├── config/            # Supabase config
│   │   ├── middleware/        # Auth & error handlers
│   │   ├── routes/            # All API routes
│   │   │   ├── admin/         # Admin endpoints
│   │   │   └── ...            # User endpoints
│   │   ├── utils/             # Helpers
│   │   └── server.js          # Main server
│   ├── package.json
│   └── .env                   # Supabase credentials
├── supabase-migration.sql     # Database schema
├── API_ENDPOINTS.json         # Complete endpoint docs
└── README.md                  # This file
```

---

---

## 🚀 Deployment

### Quick Deploy (Automatic)

```bash
# Download installer
curl -O https://raw.githubusercontent.com/YOUR_REPO/install.sh
chmod +x install.sh
./install.sh
```

### VPS Deployment

See: `DEPLOY.md` for complete VPS setup guide

### Management

```bash
# Use management script
chmod +x manage.sh
./manage.sh

# Available commands:
# 1) Status    - Check service
# 2) Start     - Start server
# 3) Restart   - Restart server
# 4) Logs      - View logs
# 5) Update    - Update code
# 6) Migrate   - Run DB migration
# 7) Config    - Edit .env
# 8) Health    - Health check
# and more...
```

---

## 📚 Documentation

- `DEPLOY.md` - Complete VPS deployment guide
- `QUICK_START.md` - 5-minute local setup
- `DEMO_ACCOUNTS.md` - Demo login credentials  
- `MIGRATION_GUIDE.md` - Database migration safety
- `API_DOCS.html` - Complete API documentation
- `manage.sh` - Management script (status, logs, restart, etc.)

---

## 🎉 Ready to Deploy!

**Total: 115 Endpoints**  
**Status: Production Ready**  
**Company: AMSIT (amsit.in)**  
**Database: Run migration in Supabase**

---

## 📞 Support

**Company:** AMSIT  
**Website:** amsit.in  
**Email:** support@amsit.in
