# Deployment Guide - Redis Version

This guide explains how to deploy your health tracking app to Vercel with Redis storage for persistent data across devices and sessions.

## 🚀 Quick Deploy to Vercel

### Step 1: Push to GitHub (if not already done)

```bash
git add .
git commit -m "Add Redis storage integration"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository `kintu-jai-hok`
4. Click **"Deploy"**

### Step 3: Add Redis Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create Database"** → **"Redis"**
3. Name your database: `kintu-jai-hok-health-data`
4. Select your preferred region (closest to your users)
5. Click **"Create"**

### Step 4: Connect Redis to Your Project

1. After Redis is created, click **"Connect Project"**
2. Select your `kintu-jai-hok` project
3. Vercel will automatically add the `REDIS_URL` environment variable

### Step 5: Verify Environment Variables

In your Vercel project dashboard:
1. Go to **Settings** → **Environment Variables**
2. Confirm you have:
   ```
   REDIS_URL = redis://default:your-password@your-redis-url.redns.redis-cloud.com:port
   ```

### Step 6: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on your latest deployment
3. Wait for deployment to complete

## ✅ Verification

After deployment:

1. **Visit your live app**: `https://your-project.vercel.app`
2. **Check storage status**: Look for "Cloud Sync ✓" indicator in the app
3. **Test data persistence**: 
   - Add some health data
   - Open app in different browser/device
   - Data should be synced across devices

## 🏗️ Architecture Overview

### Hybrid Storage System

Your app now uses a hybrid storage approach:

- **Primary**: Redis (Vercel's Redis service)
- **Fallback**: localStorage (when Redis is unavailable)
- **Migration**: Automatic transfer from localStorage to Redis

### Storage Components

1. **Redis Storage** (`lib/storage-redis.ts`)
   - Server-side Redis client
   - Handles all CRUD operations
   - 30-day TTL for health data

2. **API Routes** (`app/api/redis/route.ts`)
   - RESTful endpoints for Redis operations
   - Health checks and data migration
   - Error handling with localStorage fallback

3. **Client Hook** (`lib/useHealthStorage.ts`)
   - Unified interface for all storage operations
   - Automatic fallback mechanisms
   - Migration and sync status

## 🔧 Local Development with Redis

To test Redis locally:

1. **Get Redis URL from Vercel**:
   - Go to Vercel Dashboard → Storage → Redis
   - Copy your `REDIS_URL`

2. **Add to local environment**:
   ```env
   # .env.local
   REDIS_URL="redis://default:your-password@your-redis-url.redns.redis-cloud.com:port"
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```
   - You should see "Cloud Sync ✓" when Redis is connected
   - Data will persist in Redis instead of localStorage

## 📊 Data Structure

### Redis Keys

```
assessment:{date}          # Daily assessments
fatigue_scale:{id}         # Fatigue scale assessments  
exercise_session:{id}      # Exercise sessions
assessments               # List of assessment dates
fatigue_scales           # List of fatigue scale IDs
exercise_sessions        # List of exercise session IDs
```

### Data Types

```typescript
// Daily Assessment
{
  date: "2025-01-31",
  morningAssessment: { ... },
  exerciseSession: { ... },
  dailyNotes: "...",
  symptoms: [...],
  medicalData: { ... }
}

// Fatigue Scale
{
  id: "uuid",
  date: "2025-01-31", 
  type: "FSS" | "FACIT-F",
  scores: [...],
  totalScore: number,
  interpretation: "..."
}

// Exercise Session
{
  id: "uuid",
  date: "2025-01-31",
  exerciseType: { ... },
  preExercise: { ... },
  duringExercise: [...],
  postExercise: { ... }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"Local Storage" instead of "Cloud Sync"**
   - Check Redis connection in Vercel dashboard
   - Verify `REDIS_URL` environment variable
   - Check API route `/api/redis?action=health-check`

2. **Data not syncing**
   - Ensure Redis is connected to your project
   - Check browser console for API errors
   - Try force refresh (Ctrl+F5)

3. **Build failures**
   - Verify all environment variables are set
   - Check for TypeScript errors
   - Ensure Redis URL format is correct

### Debug Commands

```bash
# Check Redis connection locally
curl http://localhost:3000/api/redis?action=health-check

# Check build logs
vercel logs your-deployment-url

# Redeploy specific commit
vercel --prod
```

## 🔐 Security Features

- **Environment Variables**: Credentials stored securely in Vercel
- **Redis Authentication**: Password-protected Redis instance
- **SSL/TLS**: Encrypted connections to Redis
- **Data TTL**: Automatic cleanup after 30 days

## 📈 Monitoring

Monitor your Redis usage:
1. **Vercel Dashboard** → **Storage** → **Redis**
2. Check metrics: memory usage, operations/sec, connections
3. Monitor costs and usage limits

## 🎯 Next Steps

After successful deployment:

1. **Share your app**: `https://your-project.vercel.app`
2. **Custom domain**: Add your domain in Vercel settings
3. **PWA features**: Users can "Add to Home Screen"
4. **Backup strategy**: Consider exporting data regularly

## 💡 Tips

- **Development**: Use localStorage for faster local development
- **Production**: Redis provides cross-device sync and better reliability
- **Migration**: Existing localStorage data automatically migrated on first Redis connection
- **Fallback**: App works offline/without Redis using localStorage

Your health tracking app is now production-ready with persistent cloud storage! 🎉
