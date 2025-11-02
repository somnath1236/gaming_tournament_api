# 🗄️ Database Migration Guide

## ✅ How the SQL Works

The `supabase-migration.sql` file uses **safe SQL statements** that **won't overwrite** your existing data!

---

## 🔒 Safe Migration Commands

### 1. **CREATE TABLE IF NOT EXISTS**
```sql
CREATE TABLE IF NOT EXISTS users (...);
```
- ✅ **Does NOT overwrite** existing tables
- ✅ **Skips** if table already exists
- ✅ **No data loss**

### 2. **ON CONFLICT DO NOTHING**
```sql
INSERT INTO users (...) VALUES (...)
ON CONFLICT (email) DO NOTHING;
```
- ✅ **Does NOT overwrite** existing data
- ✅ **Skips** if row already exists (based on unique constraint)
- ✅ **Keeps** your existing users/admins

---

## 📋 What Happens When You Run the SQL

### Scenario 1: Fresh Database (No Tables Yet)
```
Run SQL → Creates all 23 tables → Inserts demo data → Done! ✅
```

### Scenario 2: Tables Already Exist (You ran it before)
```
Run SQL → Skips table creation → Inserts ONLY new demo data → Existing data untouched ✅
```

### Scenario 3: Data Already Exists
```
Run SQL → Skips table creation → Skips existing demo data → Only adds missing data ✅
```

---

## 🎯 Example Behavior

### First Time:
```sql
-- Creates: users table
-- Inserts: 4 demo users
```

### Second Time (Same Data):
```sql
-- Skips: users table (already exists)
-- Skips: All 4 demo users (already exist due to ON CONFLICT)
```

### Third Time (Partially Filled):
```sql
-- Skips: users table
-- Skips: 2 existing users
-- Inserts: 2 missing users only
```

---

## 🧪 Test the Safety

You can run the SQL **multiple times** without any issues:

```sql
-- Run once
Result: Tables created, data inserted

-- Run again (same SQL)
Result: Nothing changed, no errors

-- Run 10 times
Result: Same outcome each time
```

---

## 📊 Migration Checklist

### Before Running:
- [ ] Backup your existing data (if any)
- [ ] Have Supabase SQL Editor open
- [ ] Copy entire `supabase-migration.sql` file

### After Running:
- [ ] Check for success messages
- [ ] Verify tables created (23 total)
- [ ] Test demo account login
- [ ] Check `/health` endpoint

---

## 🚀 Quick Migration Steps

### Step 1: Open Supabase
Go to: **http://72.60.218.82:8000/project/default**

### Step 2: SQL Editor
Click **"SQL Editor"** in left sidebar

### Step 3: Copy SQL
Open `supabase-migration.sql` and **copy ALL** content

### Step 4: Paste & Run
Paste in SQL Editor and click **"Run"** (green button)

### Step 5: Success!
Wait for success messages:
```
✅ Database migration completed successfully!
✅ All 23 tables created with indexes
✅ Demo data inserted
```

---

## ⚠️ Important Notes

**The SQL is 100% safe to run multiple times!**

- Uses `IF NOT EXISTS` for all tables
- Uses `ON CONFLICT DO NOTHING` for all inserts
- No `DROP`, `DELETE`, or `TRUNCATE` commands
- Completely idempotent (can run many times)

---

## 🔄 What Gets Created

**23 Tables:**
1. users
2. admins
3. tournaments
4. tournament_registrations
5. teams
6. players
7. transactions
8. coin_packages
9. rewards
10. redemptions
11. streamers
12. streams
13. support_tickets
14. ticket_messages
15. notifications
16. kyc_submissions
17. audit_logs
18. init_tokens ← **NEW!**

Plus demo data for testing!

---

**🎉 Your database is safe and ready!**

