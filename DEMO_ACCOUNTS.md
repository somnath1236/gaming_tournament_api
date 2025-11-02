# 🎮 Demo Account Details

All demo accounts are created when you run the Supabase migration.

---

## 👤 Demo Users

**Password for ALL users:** `password123`

| Email | Name | In-Game Name | Game | Coins | Cash |
|-------|------|--------------|------|-------|------|
| gamer1@example.com | Alex Kumar | BGMIPro2024 | BGMI | 5000 | 1000 |
| gamer2@example.com | Priya Sharma | ValorantQueen | Valorant | 3000 | 500 |
| gamer3@example.com | Rahul Singh | COD_Master | COD Mobile | 2000 | 250 |
| proplayer@example.com | Sneha Patel | FF_Champion | Free Fire | 8000 | 2000 |

---

## 👑 Admin Accounts

**Password:** `admin123`

| Email | Name | Role |
|-------|------|------|
| admin@example.com | Admin User | super_admin |
| moderator@example.com | Moderator User | admin |

---

## 🎯 Sample Data Included

✅ **4 Demo Users** - Ready to test login/register  
✅ **2 Admin Users** - Ready for admin panel  
✅ **4 Tournaments** - All games covered  
✅ **7 Rewards** - Gift cards, gaming gear, etc.  
✅ **4 Coin Packages** - Wallet top-ups  
✅ **1 Live Stream** - BGMI stream  
✅ **Placeholder Images** - All from Unsplash  

---

## 🧪 Test Login

### As User:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "gamer1@example.com",
    "password": "password123",
    "init_token": "YOUR_INIT_TOKEN"
  }'
```

### As Admin:
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

---

**Note:** First get init_token from `/auth/init` before testing user login!

