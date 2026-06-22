# DEPLOYMENT RUNBOOK — Planned

## Current Deployment

### GitHub
- Repository: https://github.com/isaJrKai/planned
- Branch: main
- Auto-commits: enabled (platform snapshots)

### Neon Database
- Host: ep-divine-heart-af994g0p-pooler.c-2.us-west-2.aws.neon.tech
- Database: neondb
- SSL: required
- Pooling: enabled (pooler endpoint)

### Vercel
- Project: my-project (elastico team)
- Production URL: https://my-project-one-rust-23.vercel.app
- Framework: Next.js (auto-detected)
- Build: prisma generate && next build
- Postinstall: prisma generate

## Environment Variables

| Variable | Value |
|---|---|
| DATABASE_URL | postgresql://...neon.tech/neondb?sslmode=require |
| JWT_SECRET | (64-char random string) |
| FOUNDER_EMAIL | worldclasswinner@protonmail.com |
| DISABLE_FOUNDER_RECOVERY | true |
| NODE_ENV | production |

## Deployment Steps

### Automatic (git push)
1. Push to main branch on GitHub
2. Vercel auto-deploys
3. Build runs: npm install → postinstall (prisma generate) → next build
4. Deploy to production

### Manual (Vercel CLI)
```bash
vercel --prod --yes --token=$VERCEL_TOKEN
```

## Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" https://my-project-one-rust-23.vercel.app/
# Expect: 200

curl -s https://my-project-one-rust-23.vercel.app/api/auth/setup
# Expect: {"setupRequired":false} (after setup) or {"setupRequired":true} (before)
```

## Rollback
1. Vercel dashboard → Deployments → find last good → "Instant Rollback"
2. OR: git revert + push

## Disaster Recovery
1. **Database:** Neon dashboard → Restore → choose timestamp
2. **App:** Vercel dashboard → Instant Rollback to previous deployment
3. **Secrets:** Rotate JWT_SECRET → update Vercel env → redeploy
4. **Founder lockout:** Connect to Neon → delete SystemSettings row → visit /setup

## Post-Deployment Security
1. Revoke GitHub token (github.com/settings/tokens)
2. Revoke Vercel token (vercel.com/account/tokens)
3. Rotate Neon password (Neon console)
4. Rotate JWT_SECRET (generate new → update Vercel → redeploy)
