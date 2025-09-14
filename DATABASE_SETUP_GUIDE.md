# 🗄️ Database Setup Guide

## 🎯 Overview

This guide explains how to set up databases for both **local development** and **production deployment** after the recent schema updates.

## ✅ Current Status

- ✅ **Local Development**: SQLite database working
- ✅ **API Endpoints**: All functioning correctly
- ✅ **Schema**: Updated for flexible database providers
- ✅ **Error Fixed**: JavaScript "e.map is not a function" resolved

## 🔧 Local Development Setup

### Current Configuration
```bash
# .env.local
DATABASE_URL="file:./dev.db"
```

### Commands Used
```bash
# Generate Prisma client
npx prisma generate

# Create/sync database
DATABASE_URL="file:./dev.db" npx prisma db push

# Seed database (optional)
npm run db:seed
```

## 🚀 Production Deployment

### For Vercel Deployment

1. **Update Prisma Schema for Production**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set Up Cloud Database**
   
   **Option A: Vercel Postgres**
   - Vercel Dashboard → Storage → Create Database → Postgres
   - Copy connection string
   
   **Option B: Supabase**
   - Create project at supabase.com
   - Get PostgreSQL connection string
   
   **Option C: Railway**
   - Create PostgreSQL service at railway.app

3. **Environment Variables in Vercel**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   EMAIL_FROM=your_gmail@gmail.com
   ANTHROPIC_API_KEY=your_claude_api_key
   NEXTAUTH_SECRET=your_32_char_random_string
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **Deploy and Migrate**
   ```bash
   # Push code changes
   git add .
   git commit -m "Update for production database"
   git push origin main
   
   # After Vercel deployment, run migration
   npx prisma db push
   ```

## 🔄 Switching Between Environments

### Development → Production
1. Update `prisma/schema.prisma` provider to `postgresql`
2. Set production `DATABASE_URL`
3. Run `npx prisma generate`
4. Deploy

### Production → Development
1. Update `prisma/schema.prisma` provider to `sqlite`
2. Ensure local `DATABASE_URL="file:./dev.db"`
3. Run `npx prisma generate`
4. Run `DATABASE_URL="file:./dev.db" npx prisma db push`

## 🐛 Troubleshooting

### "e.map is not a function" Error
- **Cause**: API returning null/undefined instead of array
- **Solution**: Ensure database is connected and seeded
- **Status**: ✅ Fixed

### "Unable to open database file" Error
- **Cause**: Using SQLite in serverless environment
- **Solution**: Use PostgreSQL for production
- **Status**: ✅ Documented in VERCEL_DATABASE_FIX.md

### Prisma Client Errors
- **Solution**: Always run `npx prisma generate` after schema changes
- **For environment switches**: Regenerate client for new provider

## 📋 Quick Commands Reference

```bash
# Local development
DATABASE_URL="file:./dev.db" npx prisma db push
npx prisma generate
npm run dev

# Production setup
npx prisma generate
npx prisma db push  # (with production DATABASE_URL)

# Reset local database
rm prisma/dev.db
DATABASE_URL="file:./dev.db" npx prisma db push
npm run db:seed
```

---

**Status**: ✅ All database issues resolved, both local and production paths documented