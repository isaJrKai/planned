# ARCHITECTURE — Planned

**Date:** 2026-06-22
**Stage:** 2 — Architecture Documentation

---

## 1. System Overview

Planned is a Next.js 16 App Router application deployed on Vercel with a PostgreSQL database hosted on Neon. It uses JWT-based authentication with bcrypt password hashing and TOTP 2FA support.

```
┌─────────────────────────────────────────────────────┐
│                    USER (Browser)                    │
│                                                      │
│  React 19 + Zustand store (client state)            │
│  Tailwind CSS 4 (styling)                           │
│  PWA (manifest + icons + service worker)            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────┐
│                  VERCEL (Hosting)                    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Edge Runtime (Middleware)                   │    │
│  │  - Route protection (deny-by-default)        │    │
│  │  - JWT verification (jose, no Prisma)        │    │
│  │  - auth-edge.ts (Edge-compatible module)     │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Serverless Functions (Node.js Runtime)      │    │
│  │  - 19 API routes                             │    │
│  │  - Prisma ORM → PostgreSQL                   │    │
│  │  - bcryptjs, otpauth, qrcode                 │    │
│  │  - auth.ts (full auth library)               │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  Static / Server-Rendered Pages              │    │
│  │  - 5 pages (/, /login, /setup, /admin, ...)  │    │
│  │  - Server components (auth gates)            │    │
│  │  - Client components (dashboards, forms)     │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              NEON (PostgreSQL)                       │
│                                                      │
│  30 models, transactional writes                    │
│  SSL required, connection pooling                    │
│  DB-backed rate limiting + 2FA challenges            │
└─────────────────────────────────────────────────────┘
```

## 2. Layer Architecture

### Layer 1: Client (Browser)
- **DashboardClient.tsx** (1,379 lines) — Parent dashboard, all tabs
- **LoginForm.tsx** — Two-step login (password → 2FA)
- **SetupForm.tsx** — One-time founder setup with optional 2FA enrollment
- **SecuritySettingsForm.tsx** — Password/email/2FA management
- **14 app components** — Charts, modals, goals, child dashboard, etc.
- **Zustand store** — Client-side state (children, transactions, goals, etc.)

### Layer 2: Middleware (Edge Runtime)
- **middleware.ts** — Deny-by-default route protection
- **auth-edge.ts** — Edge-compatible JWT verification (no Node.js deps)
- Runs on every request before route handlers
- Public allowlist: 6 auth endpoints
- SUPER_ADMIN-only: /api/admin/*, /api/feature-flags/*, /admin/*

### Layer 3: API Routes (Node.js Serverless)
- **19 API routes** across 4 categories:
  - Auth (6): setup, login, logout, me, verify-2fa, setup-2fa-secret
  - Admin (5): 2fa/enroll, 2fa/disable, 2fa/status, password, security
  - App (8): state, mutations, achievements, lessons, recommendations, etc.

### Layer 4: Business Logic (Lib + Server)
- **auth.ts** (669 lines) — JWT, bcrypt, TOTP, rate limiting, audit logging
- **db-queries.ts** (423 lines) — All database operations, transactional
- **store.ts** (555 lines) — Zustand store with derived selectors
- **rate-limit.ts** — DB-backed rate limiting (RateLimitEntry table)
- **4 server services** — Achievement, education, recommendation, token

### Layer 5: Database (PostgreSQL via Prisma)
- **30 models** with indexes, relations, cascading deletes
- **Transactional writes** for all financial operations
- **DB-backed** rate limiting and 2FA challenges (survive restarts)

## 3. Authentication Flow

```
                    ┌──────────┐
                    │  User    │
                    │  visits  │
                    │  /       │
                    └────┬─────┘
                         │
                         ▼
              ┌──────────────────┐
              │  middleware.ts    │
              │  (Edge Runtime)  │
              │                  │
              │  Read cookie     │
              │  Verify JWT      │
              │  (jose, no DB)   │
              └────────┬─────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
      No cookie   Cookie valid   Cookie invalid
           │       + role ok         │
           │           │             │
           ▼           ▼             ▼
     Redirect to  Pass through   Treat as no cookie
     /login       to route       (redirect to /login)
                       │
                       ▼
              ┌──────────────────┐
              │  Server Component│
              │  (page.tsx)      │
              │                  │
              │  getAuthUser()   │
              │  (reads DB for   │
              │   current role)  │
              └────────┬─────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
      No session   Session valid  System not
           │           │           │ initialized
           ▼           ▼           ▼
       Redirect    Render       Redirect
       to /login   dashboard    to /setup
```

## 4. State Flow

```
┌─────────────────────────────────────────────────┐
│                  BROWSER                         │
│                                                  │
│  ┌─────────────┐     ┌──────────────────────┐   │
│  │ User action │────▶│ Zustand store        │   │
│  │ (e.g. Save  │     │ (optimistic update)  │   │
│  │  $1000)     │     └──────────┬───────────┘   │
│  └─────────────┘                │               │
│                          ┌──────┴──────┐        │
│                          │ mutations.ts│        │
│                          │ (persistence│        │
│                          │  wrapper)   │        │
│                          └──────┬──────┘        │
│                                 │ fetch()       │
│                                 ▼               │
└─────────────────────────────────┼───────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────┐
│                  SERVER                          │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  /api/mutations                         │    │
│  │  → db-queries.ts                        │    │
│  │  → db.$transaction (atomic writes)      │    │
│  │  → return updated state                 │    │
│  └────────────────────────┬────────────────┘    │
│                           │                     │
│                           │ JSON response       │
│                           │ (full state)        │
│                           ▼                     │
└───────────────────────────┼─────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────┐
│                  BROWSER                         │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  store-hydration.ts                     │    │
│  │  useStore.setState(server state)        │    │
│  │  (replaces optimistic with server truth)│    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  If fetch failed → rehydrate (rollback)         │
└─────────────────────────────────────────────────┘
```

## 5. Database Flow

```
API Route Handler
    │
    ▼
db-queries.ts (or auth.ts)
    │
    ├── Read operations
    │   └── db.{model}.findMany / findUnique / count / aggregate
    │       (no transaction needed)
    │
    ├── Write operations (single table)
    │   └── db.{model}.create / update / delete
    │       (no transaction needed)
    │
    └── Write operations (multi-table / financial)
        └── db.$transaction(async (tx) => {
              tx.child.update({ ... })      // atomic
              tx.transaction.create({ ... }) // atomic
              tx.account.update({ ... })    // atomic
            })
            // If ANY write fails, ALL roll back
```

## 6. Deployment Flow

```
Developer
    │
    ├── git push origin main
    │
    ▼
GitHub Repository
    │
    ├── Vercel webhook fires
    │
    ▼
Vercel Build Pipeline
    │
    ├── npm install
    ├── postinstall: prisma generate
    ├── npm run build (next build)
    │   ├── TypeScript compilation
    │   ├── ESLint (if configured)
    │   ├── Route compilation (27 routes)
    │   └── Static page generation
    │
    ▼
Vercel Deployment
    │
    ├── Edge functions (middleware)
    ├── Serverless functions (API routes)
    ├── Static assets (CDN)
    └── Server-rendered pages
    │
    ▼
Vercel → Neon (PostgreSQL)
    │
    ├── DATABASE_URL env var
    ├── SSL required (sslmode=require)
    └── Connection pooling (Neon pooler)
    │
    ▼
Application is LIVE
```

## 7. Security Boundaries

```
┌──────────────────────────────────────────────────┐
│  PUBLIC (no auth required)                        │
│  - /                                              │
│  - /login                                         │
│  - /setup (one-time only)                         │
│  - /api/auth/setup (GET)                          │
│  - /api/auth/login (POST)                         │
│  - /api/auth/verify-2fa (POST)                    │
│  - /api/auth/logout (POST)                        │
│  - /api/auth/me (GET)                             │
│  - /manifest.webmanifest                          │
│  - /sw.js                                         │
│  - /icons/*                                       │
│  - /favicon.ico                                   │
├──────────────────────────────────────────────────┤
│  AUTHENTICATED (any logged-in user)               │
│  - /api/state                                     │
│  - /api/mutations                                 │
│  - /api/achievements                              │
│  - /api/lessons                                   │
│  - /api/lessons/[slug]                            │
│  - /api/lessons/complete                          │
│  - /api/recommendations                           │
├──────────────────────────────────────────────────┤
│  SUPER_ADMIN ONLY (founder only)                  │
│  - /admin                                         │
│  - /admin/security                                │
│  - /api/admin/2fa/enroll                          │
│  - /api/admin/2fa/disable                         │
│  - /api/admin/2fa/status                          │
│  - /api/admin/password                            │
│  - /api/admin/security                            │
└──────────────────────────────────────────────────┘
```

## 8. File Organization (Current)

```
src/
├── app/                        # Next.js App Router
│   ├── admin/                  # Admin pages (SUPER_ADMIN)
│   │   └── security/           # Security settings
│   ├── api/                    # API routes (19 total)
│   │   ├── admin/              # Admin APIs (5)
│   │   ├── auth/               # Auth APIs (6)
│   │   └── *.ts                # App APIs (8)
│   ├── login/                  # Login page
│   ├── setup/                  # Setup page
│   ├── DashboardClient.tsx     # Parent dashboard (client)
│   ├── layout.tsx              # Root layout
│   ├── loading.tsx             # Route fallback
│   └── page.tsx                # Auth gate (server)
├── components/                 # UI components
│   ├── ui/                     # shadcn/ui (48, mostly unused)
│   └── *.tsx                   # App components (12)
├── hooks/                      # React hooks (2)
├── lib/                        # Core libraries (14)
│   ├── auth.ts                 # Full auth library (Node.js)
│   ├── auth-edge.ts            # Edge-compatible auth (JWT only)
│   ├── db.ts                   # Prisma client
│   ├── db-queries.ts           # Database operations
│   ├── store.ts                # Zustand store
│   └── ...                     # Other utilities
├── server/                     # Server-side services
│   ├── domain/                 # Domain events + types
│   └── services/               # Business services (4)
└── middleware.ts               # Route protection
```

## 9. Refactoring Recommendations (Not Executed)

These changes would improve maintainability but are NOT executed in this stage to avoid breaking the deployed application:

1. **Split DashboardClient.tsx** (1,379 lines) into:
   - `OverviewTab.tsx`
   - `ChildrenTab.tsx`
   - `TransactionsTab.tsx`
   - `InvestmentsTab.tsx`
   - `TokensTab.tsx`
   - `GoalsTab.tsx`
   - `SettingsTab.tsx`
   - `Sidebar.tsx`
   - `Topbar.tsx`

2. **Split goals.tsx** (941 lines) into individual goal components

3. **Split modals.tsx** (707 lines) into individual modal files

4. **Remove unused shadcn/ui components** (47 of 48 unused)

5. **Standardize naming** — convert all to kebab-case

6. **Add feature folders** — group by feature (auth, family, finance, education)

These should be executed in a dedicated refactoring sprint with comprehensive testing.
