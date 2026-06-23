# Planned — Deployment Guide

## Overview

This guide deploys Planned to production using:
- **GitHub** — code repository
- **Neon** — PostgreSQL database (free)
- **Vercel** — Next.js hosting (free)

**Total cost: $0**
**Time: ~15 minutes**

---

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (if installed)
```bash
# Install GitHub CLI if needed
# Mac: brew install gh
# Windows: winget install GitHub.cli
# Linux: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

gh auth login
gh repo create planned --public --source=. --push
```

### Option B: Using GitHub.com (manual)
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `planned`
3. Set to **Public** (or Private if you prefer)
4. **Do NOT** initialize with README (we already have one)
5. Click "Create repository"
6. Copy the commands GitHub shows you (they'll look like):
```bash
git remote add origin https://github.com/YOUR_USERNAME/planned.git
git branch -M main
git push -u origin main
```
7. Run those commands in your terminal

### Verify
```bash
git remote -v
# Should show: origin  https://github.com/YOUR_USERNAME/planned.git
```

---

## Step 2: Create Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (free, no credit card needed)
3. Click "Create Project"
4. Name: `planned`
5. Region: Choose closest to you
6. Click "Create Project"

### Get your connection string
Neon will show you a connection string like:
```
postgresql://planned_owner:AbCdEf123456@ep-cool-name-123456.us-east-2.aws.neon.tech/planned?sslmode=require
```

**Copy this string** — you'll need it for Vercel.

### Create the database schema
Run this in your terminal (replace with your actual connection string):
```bash
# Set your Neon connection string temporarily
export DATABASE_URL="postgresql://planned_owner:AbCdEf123456@ep-cool-name-123456.us-east-2.aws.neon.tech/planned?sslmode=require"

# Push the schema to Neon
npx prisma db push

# Verify
npx prisma generate
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# When prompted:
# - Set up and deploy: Y
# - Which scope: (your account)
# - Link to existing project: N
# - Project name: planned
# - Directory: ./
# - Override settings: N

# Set environment variables
vercel env add DATABASE_URL
# Paste your Neon connection string

vercel env add JWT_SECRET
# Paste your 64-char secret (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")

vercel env add FOUNDER_EMAIL
# Type: worldclasswinner@protonmail.com

vercel env add DISABLE_FOUNDER_RECOVERY
# Type: true

vercel env add NODE_ENV
# Type: production

# Redeploy with env vars
vercel --prod
```

### Option B: Using Vercel.com (recommended for first-time)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (free)
3. Click "Add New Project"
4. Import your `planned` repository
5. Vercel auto-detects Next.js — settings are correct
6. **Before clicking Deploy**, expand "Environment Variables" and add:

| Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://planned_owner:...@...neon.tech/planned?sslmode=require` |
| `JWT_SECRET` | (your 64-char secret — generate one below) |
| `FOUNDER_EMAIL` | `worldclasswinner@protonmail.com` |
| `DISABLE_FOUNDER_RECOVERY` | `true` |
| `NODE_ENV` | `production` |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

7. Click "Deploy"
8. Wait ~2 minutes for build to complete

---

## Step 4: Test the Preview Deployment

Vercel gives you a preview URL like:
```
https://planned-abc123-your-username.vercel.app
```

### Test checklist:
1. ✅ Visit the URL — should redirect to `/setup`
2. ✅ Create your founder account (use your real email + strong password)
3. ✅ Optionally enroll in 2FA
4. ✅ After setup, you should be on `/admin`
5. ✅ Click "Back to app" — should see parent dashboard
6. ✅ Add a test child
7. ✅ Award test tokens
8. ✅ Log out → log back in
9. ✅ Test on mobile (responsive)

### If everything works:
Go back to Vercel dashboard → click "Promote to Production"

---

## Step 5: Production Deployment

In Vercel:
1. Go to your project → "Deployments"
2. Find the successful preview deployment
3. Click "..." → "Promote to Production"
4. OR: Push to `main` branch on GitHub → Vercel auto-deploys to production

Your production URL will be:
```
https://planned.vercel.app
```
(or similar — you can customize it in project settings)

---

## Post-Deployment

### Verify production
```bash
# Test the production URL
curl -s -o /dev/null -w "%{http_code}" https://planned.vercel.app/
# Should return 200

# Test setup endpoint
curl -s https://planned.vercel.app/api/auth/setup
# Should return {"setupRequired":true} (first time)

# Test security (should be 401)
curl -s -o /dev/null -w "%{http_code}" https://planned.vercel.app/api/state
# Should return 401
```

### Run security check
```bash
npm run security:check
# Should show 9/9 PASS
```

---

## Rollback Instructions

### Vercel rollback
1. Go to Vercel dashboard → your project → "Deployments"
2. Find the last known-good deployment
3. Click "..." → "Instant Rollback"
4. Vercel switches traffic immediately

### Database rollback (Neon)
Neon supports **point-in-time restore**:
1. Go to Neon dashboard → your project
2. "Restore" → choose timestamp before the issue
3. Neon creates a branch with the restored state
4. Update `DATABASE_URL` in Vercel to point to the restored branch

---

## Secret Rotation

### Rotate JWT_SECRET
1. Generate new secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
2. Update in Vercel: Settings → Environment Variables → `JWT_SECRET` → update
3. Redeploy: push any commit to GitHub OR click "Redeploy" in Vercel
4. **Note:** All existing sessions will be invalidated — users must log in again

### Rotate Neon database password
1. Go to Neon dashboard → your project → "Settings"
2. "Reset password"
3. Copy new connection string
4. Update `DATABASE_URL` in Vercel
5. Redeploy

---

## Troubleshooting

### Build fails on Vercel
- Check that `DATABASE_URL` is set correctly
- Check Vercel build logs for specific errors
- Ensure `prisma generate` runs (it's in `postinstall` script)

### "Database connection error"
- Verify `DATABASE_URL` includes `?sslmode=require`
- Verify Neon project is not suspended (free tier suspends after inactivity)
- Check Neon dashboard for connection limits

### "404 on all routes"
- Ensure middleware is working (check Vercel functions log)
- Verify build completed successfully

### "Setup endpoint returns 410"
- This means the system is already initialized
- To re-setup: clear the `SystemSettings` table in Neon, OR run `npm run founder:recover` locally with a dev database

---

## Environment Variables Reference

| Variable | Required | Production Value | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | `postgresql://...neon.tech/planned?sslmode=require` | Neon connection string |
| `JWT_SECRET` | ✅ Yes | (64-char random string) | JWT signing secret |
| `FOUNDER_EMAIL` | No | `worldclasswinner@protonmail.com` | Pre-fills /setup form |
| `DISABLE_FOUNDER_RECOVERY` | No | `true` | Disables founder:recover script |
| `NODE_ENV` | No | `production` | Sets production mode |

---

## Architecture

```
GitHub (code)
    ↓ push to main
Vercel (auto-deploy)
    ↓ connects to
Neon (PostgreSQL database)
    ↓ persists
Users (founder + family data)
```

**Cost: $0** (all free tiers)
**Uptime: 99.9%** (Vercel + Neon SLAs)
**SSL: Automatic** (Vercel provides HTTPS)
**CDN: Automatic** (Vercel edge network)
