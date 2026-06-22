# Planned — Family Savings & Allowance

A family financial education platform that teaches children disciplined wealth-building through saving, goals, investments, tokens, and financial literacy.

## Quick Start (Local Development)

### Prerequisites
- **Node.js 18+** (tested on Node 20 and 22)
- **npm** (comes with Node.js)

### Setup Steps

```bash
# 1. Extract the archive
tar -xzf planned-app.tar.gz
# OR: unzip planned-app.zip
cd planned-app

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env

# 4. Edit .env — set your JWT_SECRET
#    Generate one with:
#    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    Paste the output after JWT_SECRET=
#    Also set FOUNDER_EMAIL to your real email

# 5. Create the database + generate Prisma client
npx prisma db push
npx prisma generate

# 6. Run the security check (verifies everything is ready)
npm run security:check

# 7. Start the dev server
npm run dev

# 8. Open http://localhost:3000 in your browser
#    You'll be redirected to /setup — create your founder account
```

### Production Build

```bash
npm run build
npm run start
```

## What's Included

### Authentication & Security
- **Founder-only administration** — exactly one SUPER_ADMIN account
- **JWT sessions** — HttpOnly + SameSite=Strict cookies, 7-day expiry
- **bcrypt password hashing** — cost factor 12
- **TOTP 2FA** — Google Authenticator / Authy / 1Password compatible
- **Backup codes** — 8 single-use codes, bcrypt-hashed
- **DB-backed rate limiting** — 5 login attempts / 15 min / IP
- **DB-backed 2FA challenges** — survives server restarts
- **Account lockout** — 10 failed attempts → 30 min lockout
- **Audit logging** — every auth event + admin action recorded

### Application Features
- Parent dashboard with financial overview
- Child dashboards with goals, savings, investments, tokens
- Token economy (buy rate: 50, redeem rate: 80)
- Goals (save / spend_less, weekly / monthly / annual, private / revealed)
- Spending tracking with categories
- AI Financial Coach (GLM via z-ai-web-dev-sdk)
- Financial literacy lessons (6 lessons + quizzes + certificates)
- Achievement system (10 badges + streaks)
- 4 themes (dark, light, pink, red)
- PWA installable (manifest + icons + service worker)

### PWA
- `public/manifest.webmanifest` — full PWA manifest
- `public/icons/` — 14 PNG icons (16px–1024px) + apple-touch-icon + favicon
- `public/sw.js` — service worker (Cache-First for assets, Network-First for API, Stale-While-Revalidate for pages)
- Auto-registers in production mode

### Scripts
- `npm run security:check` — 9-point production readiness audit
- `npm run founder:recover` — dev-only emergency founder reset (requires interactive TTY + typed confirmation)
- `npm run typecheck` — TypeScript strict mode check
- `npm run lint` — ESLint
- `npm run db:push` — push schema to database
- `npm run db:generate` — regenerate Prisma client

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path (e.g., `file:./db/custom.db`) |
| `JWT_SECRET` | Yes | 32+ char random string (64 recommended) |
| `FOUNDER_EMAIL` | No | Pre-fills /setup form |
| `NODE_ENV` | No | `development` or `production` |
| `DISABLE_FOUNDER_RECOVERY` | No | Set to `true` in production |

## Security Model

- **One founder account** — created via `/setup` (one-time, then permanently disabled)
- **SUPER_ADMIN role** — hardcoded in `performFounderSetup()`, never accepted from client
- **Deny-by-default middleware** — all `/api/*` routes require session except 6 public auth endpoints
- **Defense in depth** — middleware + admin layout server guard + per-route role checks
- **User ID is authoritative** — email is metadata, can be changed without changing identity

## Database

- **ORM:** Prisma
- **Database:** SQLite (easily switchable to PostgreSQL by changing `DATABASE_URL`)
- **29 models** including User, SystemSettings, AuditLog, RateLimitEntry, TwoFactorChallenge
- **Transactional financial writes** — all money operations wrapped in `db.$transaction`
- **Atomic conditional updates** — prevents TOCTOU race conditions on balances

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin console (SUPER_ADMIN only)
│   │   ├── security/      # Security settings (2FA, password, email)
│   │   ├── layout.tsx     # Server-side role guard
│   │   └── page.tsx       # Admin dashboard
│   ├── api/               # API routes (19 total)
│   │   ├── admin/         # Admin-only APIs (2FA, password, security)
│   │   ├── auth/          # Auth APIs (setup, login, logout, me, verify-2fa)
│   │   ├── state/         # App state hydration
│   │   ├── mutations/     # Financial mutations
│   │   └── ...            # Lessons, achievements, recommendations
│   ├── login/             # Login page
│   ├── setup/             # One-time founder setup page
│   ├── layout.tsx         # Root layout (PWA metadata, splash screen, SW registration)
│   ├── page.tsx           # Auth gate → redirects to /setup or /login
│   ├── DashboardClient.tsx # Parent dashboard (client component)
│   └── loading.tsx        # Route-transition loading state
├── components/            # 13 React components
├── lib/                   # 13 modules (auth, db, store, etc.)
├── server/                # Domain services (achievements, education, etc.)
└── middleware.ts          # Deny-by-default route protection

public/
├── icons/                 # 14 PWA icons
├── manifest.webmanifest   # PWA manifest
├── sw.js                  # Service worker
└── favicon.ico

scripts/
├── founder-recover.js     # Dev-only emergency reset
└── security-check.js      # Production readiness audit

prisma/
└── schema.prisma          # 29 models
```

## Production Deployment

### Vercel
1. Push to GitHub
2. Import to Vercel
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `FOUNDER_EMAIL`, `DISABLE_FOUNDER_RECOVERY=true`
4. Deploy
5. Visit `/setup` once to create founder account

### Self-hosted
1. `npm run build`
2. Copy `.next/standalone/` to your server
3. Set environment variables
4. Run `node server.js`
5. Visit `/setup` once

## If You Forget Your Password

Run locally:
```bash
npm run founder:recover
```
This will:
1. Verify you're in development mode
2. Require interactive terminal (no automation)
3. Ask you to type "I UNDERSTAND THE CONSEQUENCES"
4. Wait 10 seconds (Ctrl+C to abort)
5. Delete the founder account + SystemSettings
6. Log the action to audit trail
7. Allow you to re-run `/setup`

**In production:** Set `DISABLE_FOUNDER_RECOVERY=true` — the script refuses to run.

## Verification

```bash
npm run lint           # 0 errors
npm run typecheck      # 0 errors
npm run build          # 27 routes
npm run security:check # 9/9 PASS
```

## License

Private — Planned © 2026
