# ARCHITECTURE — Planned

## System Overview

Planned is a family financial education platform built on Next.js 16 App Router with PostgreSQL (Neon) and deployed on Vercel serverless.

## Technology Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4 + custom editorial design system
- **State:** Zustand (client) + Prisma (server)
- **Database:** PostgreSQL (Neon, pooled connection)
- **Auth:** JWT (jose) + bcrypt + TOTP 2FA (otpauth)
- **Hosting:** Vercel (serverless functions + Edge middleware)
- **AI:** z-ai-web-dev-sdk (GLM model for AI Coach)

## Layer Architecture

```
Browser (Client)
  → Zustand Store (state management)
  → fetch() to API routes
    → Middleware (Edge Runtime — JWT verification only)
    → API Routes (Node.js Runtime)
      → Lib Layer (auth.ts, db-queries.ts, rate-limit.ts)
      → Service Layer (achievement, education, recommendation, token)
      → Prisma Client → PostgreSQL (Neon)
```

## Authentication Architecture

1. **Founder Setup** (`/setup`) — one-time, creates SUPER_ADMIN
2. **Login** (`/login`) — email + password → JWT cookie
3. **2FA** (optional) — TOTP code verification
4. **Middleware** (Edge) — deny-by-default for /api/*
5. **Admin Layout** (Server) — re-checks role from DB

## Security Boundaries
- Edge Runtime: JWT verification only (no Prisma/bcrypt)
- Node Runtime: Full auth + database access
- Client: Optimistic updates with server rollback
- Database: Transactional writes with atomic conditional updates

## Key Design Decisions
- **auth-edge.ts vs auth.ts** — duplicated JWT verification for Edge compatibility
- **DB-backed rate limiting** — RateLimitEntry table survives restarts
- **DB-backed 2FA challenges** — TwoFactorChallenge table survives restarts
- **Deny-by-default middleware** — all /api/* protected except explicit allowlist
