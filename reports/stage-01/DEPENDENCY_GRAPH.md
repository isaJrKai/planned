# DEPENDENCY GRAPH — Planned

**Date:** 2026-06-22
**Stage:** 1 — Repository Forensics

---

## UI Layer → API Layer → Service Layer → Database Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  LoginForm   │  │  SetupForm   │  │  DashboardClient      │ │
│  │  (client)    │  │  (client)    │  │  (client, 1379 lines) │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘ │
│         │                 │                     │               │
│         │ fetch()         │ fetch()             │ useStore()    │
│         ▼                 ▼                     │ fetch()       │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
══════════╪═════════════════╪═════════════════════╪══════════════
          │                 │                     │  HTTP
══════════╪═════════════════╪═════════════════════╪══════════════
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Serverless / Edge)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MIDDLEWARE (Edge Runtime)                    │   │
│  │  src/middleware.ts                                        │   │
│  │  imports: @/lib/auth-edge (JWT verify only, no Prisma)   │   │
│  │  function: deny-by-default route protection              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐         │
│  │ /api/auth/* │  │/api/admin/* │  │ /api/state      │         │
│  │ (6 routes)  │  │ (5 routes)  │  │ /api/mutations  │         │
│  │             │  │             │  │ /api/lessons    │         │
│  │ login       │  │ 2fa/enroll  │  │ /api/achievemt  │         │
│  │ setup       │  │ 2fa/disable │  │ /api/recommend  │         │
│  │ verify-2fa  │  │ 2fa/status  │  │                 │         │
│  │ logout      │  │ password    │  │ (8 routes)      │         │
│  │ me          │  │ security    │  │                 │         │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘         │
│         │                │                   │                   │
│         ▼                ▼                   ▼                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    LIB LAYER                              │   │
│  │                                                           │   │
│  │  src/lib/auth.ts (669 lines)                             │   │
│  │    imports: jose, bcryptjs, otpauth, qrcode, @/lib/db    │   │
│  │    exports: signSession, attemptLogin, performFounderSetup│  │
│  │             enroll2FA, disable2FA, changePassword, etc.  │   │
│  │                                                           │   │
│  │  src/lib/auth-edge.ts (46 lines)                         │   │
│  │    imports: jose only (Edge-compatible)                  │   │
│  │    exports: getSessionFromCookieHeader                    │   │
│  │                                                           │   │
│  │  src/lib/db-queries.ts (423 lines)                       │   │
│  │    imports: @/lib/db, @/lib/types                        │   │
│  │    exports: getFullState, addTransaction, giveTokens,     │   │
│  │             redeemTokens, investNow, createGoal, etc.    │   │
│  │                                                           │   │
│  │  src/lib/rate-limit.ts                                   │   │
│  │    imports: @/lib/db                                     │   │
│  │    exports: rateLimit (DB-backed)                        │   │
│  │                                                           │   │
│  │  src/lib/store.ts (555 lines) — Zustand store            │   │
│  │  src/lib/store-hydration.ts — Hydration + persistence     │   │
│  │  src/lib/mutations.ts — Mutation wrappers                │   │
│  │  src/lib/logger.ts — Structured logging                   │   │
│  │  src/lib/db.ts — Prisma client singleton                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SERVER LAYER                             │   │
│  │                                                           │   │
│  │  src/server/services/                                     │   │
│  │    achievement.service.ts (419 lines)                     │   │
│  │    education.service.ts (734 lines)                       │   │
│  │    recommendation.service.ts                              │   │
│  │    token.service.ts                                       │   │
│  │                                                           │   │
│  │  src/server/domain/                                       │   │
│  │    events.ts — Domain event catalog                       │   │
│  │    achievement-types.ts — Achievement definitions         │   │
│  │                                                           │   │
│  │  src/server/permissions/ (DEAD CODE)                      │   │
│  │    guards.ts, permissions.ts, roles.ts                    │   │
│  │    → Never wired to any route handler                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  DATABASE LAYER                           │   │
│  │                                                           │   │
│  │  Prisma Client → PostgreSQL (Neon)                        │   │
│  │  30 models, ~28 indexes, transactional writes             │   │
│  │                                                           │   │
│  │  Connection string: DATABASE_URL env var                  │   │
│  │  SSL: required (sslmode=require)                          │   │
│  │  Pooling: Neon pooler endpoint                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Neon        │  │  Vercel      │  │  z-ai-web-dev-sdk    │  │
│  │  PostgreSQL  │  │  Hosting     │  │  (AI Coach, GLM)     │  │
│  │  (database)  │  │  (compute)   │  │  (external API)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
User visits /
    │
    ▼
middleware.ts (Edge Runtime)
    │
    ├── Public route? → pass through
    ├── No session cookie? → redirect to /login (browser) or 401 (API)
    ├── Session exists but role ≠ SUPER_ADMIN on admin route? → 403
    └── Session valid + role sufficient → pass through
                │
                ▼
        Server Component (page.tsx)
                │
                ├── System not initialized? → redirect to /setup
                ├── No session? → redirect to /login
                └── Session valid → render DashboardClient with isAdmin flag
```

## State Flow (Zustand)

```
DashboardClient mounts
    │
    ▼
useHydratedState() hook
    │
    ▼
fetch /api/state (authenticated)
    │
    ├── Success → useStore.setState({ children, transactions, ... })
    │              Store updates → UI re-renders
    │
    └── Failure → useStore.setState({ hydrated: true, hydrateError: "..." })
                   UI shows error state (if implemented)

User action (e.g., "Save $1000")
    │
    ▼
Optimistic update (Zustand store updates immediately)
    │
    ▼
persistMutation("addTransaction", payload)
    │
    ▼
fetch POST /api/mutations (authenticated)
    │
    ├── Success → rehydrate from server (server truth replaces optimistic)
    │
    └── Failure → rehydrate from server (rolls back optimistic update)
```

## Deployment Flow

```
git push origin main
    │
    ▼
Vercel auto-deploy
    │
    ├── npm install
    ├── postinstall: prisma generate
    ├── npm run build (next build)
    └── Deploy serverless functions + static assets
         │
         ├── Middleware → Edge function
         ├── API routes → Serverless functions (Node.js)
         ├── Pages → Static + server-rendered
         └── Public assets → CDN
              │
              ▼
         Vercel connects to Neon (DATABASE_URL env var)
              │
              ▼
         App is live
```
