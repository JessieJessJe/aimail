# Vercel PostgreSQL Database Setup Guide

## 🎯 Overview

Vercel provides three different PostgreSQL connection URLs for your database. This guide explains how to use them with your Newsly application.

## 🔑 Vercel Database Credentials

When you create a Vercel PostgreSQL database, you get three environment variables:

### 1. `DATABASE_URL_POSTGRES_URL`
- **Purpose**: Direct PostgreSQL connection
- **Use case**: Standard PostgreSQL operations, database tools
- **Format**: `postgresql://username:password@host:port/database`

### 2. `DATABASE_URL_PRISMA_DATABASE_URL` ⭐ **RECOMMENDED**
- **Purpose**: Optimized for Prisma ORM
- **Use case**: Best performance with Prisma Client
- **Format**: `prisma://accelerate.prisma-data.net/?api_key=...`
- **Benefits**: Connection pooling, query acceleration, better performance

### 3. `DATABASE_URL_DATABASE_URL`
- **Purpose**: Standard database URL
- **Use case**: General database connections
- **Format**: Similar to POSTGRES_URL but may have different optimizations

## 🚀 Setup Instructions

### Step 1: Choose Your Database URL

For **Prisma applications** (like Newsly), use `DATABASE_URL_PRISMA_DATABASE_URL`:

```bash
# In your Vercel dashboard, copy the PRISMA_DATABASE_URL value
# It should look like: prisma://accelerate.prisma-data.net/?api_key=...
```

### Step 2: Update Environment Variables

#### For Production (Vercel):
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add: `DATABASE_URL` = `[your_prisma_database_url]`

#### For Local Development:
Update your `.env.local` file:

```bash
# Replace with your actual Vercel Prisma Database URL
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=your_api_key_here"
```

### Step 3: Update Prisma Schema

Ensure your `prisma/schema.prisma` uses PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 4: Generate and Deploy

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: Seed your database
npx prisma db seed
```

## 🔄 Migration from SQLite

If you're migrating from SQLite:

### 1. Backup Current Data
```bash
# Export current SQLite data (if needed)
npx prisma db seed
```

### 2. Update Configuration
```bash
# Update schema.prisma provider to "postgresql"
# Update DATABASE_URL to Vercel PostgreSQL URL
```

### 3. Deploy Schema
```bash
npx prisma db push
```

## 🛠️ Development Workflow

### Option A: Use Vercel PostgreSQL for Development
```bash
# Use the same Vercel database for development
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

### Option B: Local PostgreSQL + Production Vercel
```bash
# Local development
DATABASE_URL="postgresql://username:password@localhost:5432/newsly_dev"

# Production (set in Vercel dashboard)
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

## 🔍 Troubleshooting

### Connection Issues
```bash
# Test database connection
npx prisma db pull

# Check Prisma client generation
npx prisma generate
```

### Environment Variable Issues
```bash
# Verify environment variables are loaded
echo $DATABASE_URL

# Check Prisma can read the URL
npx prisma validate
```

### Performance Optimization
- ✅ Use `DATABASE_URL_PRISMA_DATABASE_URL` for best performance
- ✅ Enable connection pooling in production
- ✅ Use Prisma Accelerate features

## 📋 Quick Commands Reference

```bash
# Setup PostgreSQL schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Reset database (careful!)
npx prisma db push --force-reset
```

## 🎯 Recommended Setup

1. **Use `DATABASE_URL_PRISMA_DATABASE_URL`** for optimal performance
2. **Set in Vercel Environment Variables** for production
3. **Update local `.env.local`** for development
4. **Run `npx prisma db push`** to create tables
5. **Deploy to Vercel** and test

## ⚠️ Important Notes

- The Prisma URL includes connection pooling and acceleration
- Don't commit actual database URLs to version control
- Test the connection before deploying
- Monitor database usage in Vercel dashboard

Your Newsly application is now ready for production with Vercel PostgreSQL! 🚀