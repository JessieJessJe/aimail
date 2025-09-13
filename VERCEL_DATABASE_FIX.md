# 🔧 Vercel Database Error Fix Guide

## ❌ Current Error
```
Error [PrismaClientInitializationError]: Invalid `prisma.user.findMany()` invocation:
Error querying the database: Error code 14: Unable to open the database file
```

## 🎯 Root Cause
Your Prisma schema was configured for **SQLite** with a local file database (`file:./dev.db`), but Vercel's serverless environment cannot access local files. You need a **cloud database**.

## ✅ Solution Applied

### 1. Updated Prisma Schema
- ✅ Changed from SQLite to PostgreSQL
- ✅ Updated to use `DATABASE_URL` environment variable
- ✅ Generated new Prisma client

### 2. Quick Fix Options

#### Option A: Vercel Postgres (Recommended - Free tier available)

1. **Create Vercel Postgres Database**
   - Go to your Vercel dashboard
   - Click "Storage" → "Create Database" → "Postgres"
   - Choose your project and region
   - Copy the connection string

2. **Add Environment Variable**
   - In Vercel project settings → Environment Variables
   - Add: `DATABASE_URL` = `your_postgres_connection_string`
   - Redeploy your app

#### Option B: Supabase (Free PostgreSQL)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Go to Settings → Database
   - Copy the connection string

2. **Add to Vercel**
   - Environment Variables → `DATABASE_URL`
   - Format: `postgresql://user:pass@host:port/dbname`

#### Option C: Railway (Alternative)

1. **Create Railway Database**
   - Go to [railway.app](https://railway.app)
   - Create PostgreSQL service
   - Copy connection string

2. **Add to Vercel Environment Variables**

### 3. Deploy Steps

```bash
# 1. Push your updated schema
git add .
git commit -m "Fix: Update Prisma schema for production database"
git push origin main

# 2. In Vercel dashboard:
# - Add DATABASE_URL environment variable
# - Redeploy the application

# 3. Run database migration (one-time)
# This will create your tables in the new database
npx prisma db push
```

### 4. Environment Variables Needed

In Vercel project settings, ensure you have:
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_gmail@gmail.com
ANTHROPIC_API_KEY=your_claude_api_key
NEXTAUTH_SECRET=your_32_char_random_string
NEXTAUTH_URL=https://your-app.vercel.app
```

## 🚀 Quick Recovery (5 minutes)

1. **Create Vercel Postgres** (fastest option)
2. **Add DATABASE_URL** to environment variables
3. **Redeploy** your Vercel app
4. **Run migration**: `npx prisma db push`

## ✅ Verification

After deployment, your `/api/users` endpoint should work without the database file error.

## 📝 Notes

- Your local development can still use SQLite if you prefer
- The schema now uses environment variables for flexibility
- All existing data will need to be migrated to the new database
- Consider running `npx prisma db seed` to populate initial data

---

**Status**: ✅ Schema updated, ready for cloud database deployment