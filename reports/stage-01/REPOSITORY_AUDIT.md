# REPOSITORY AUDIT — Planned

**Date:** 2026-06-22
**Auditor:** Operation Titanium — Stage 1

---

## 1. Directory Structure

```
src/
├── app/                    # Next.js App Router (5 pages, 19 API routes, 2 layouts)
│   ├── admin/             # Admin console (SUPER_ADMIN only)
│   │   └── security/      # Security settings page
│   ├── api/               # 19 API routes
│   │   ├── admin/         # Admin-only APIs (5 routes)
│   │   ├── auth/          # Auth APIs (6 routes)
│   │   └── ...            # App APIs (8 routes)
│   ├── login/             # Login page
│   ├── setup/             # One-time founder setup page
│   ├── DashboardClient.tsx # Parent dashboard (client component)
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Route-transition fallback
│   └── page.tsx           # Auth gate (server component)
├── components/            # 14 app components + 48 shadcn/ui components
├── hooks/                 # 2 hooks (use-mobile, use-toast)
├── lib/                   # 14 modules (auth, db, store, etc.)
├── server/                # 9 server modules
│   ├── domain/            # Domain events + achievement types
│   ├── permissions/       # RBAC (3 files — dead code)
│   └── services/          # 4 services (achievement, education, recommendation, token)
└── middleware.ts          # Deny-by-default route protection
```

## 2. File Inventory

| Category | Count |
|---|---|
| TypeScript files (.ts) | 45 |
| TSX files (.tsx) | 75 |
| CSS files | 1 |
| Pages (page.tsx) | 5 |
| API routes (route.ts) | 19 |
| Layouts | 2 |
| Loading files | 1 |
| Middleware | 1 |
| App components | 14 |
| shadcn/ui components | 48 |
| Lib modules | 14 |
| Server modules | 9 |
| Hooks | 2 |
| Prisma models | 30 |
| Scripts | 9 |
| Config files | 13 |
| PWA icons | 13 |
| **Total source files** | **120** |

## 3. Route Inventory

### Pages (5)
| Route | File | Auth | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | Session required | Auth gate → redirects to /setup or /login |
| `/login` | `app/login/page.tsx` | Public | Founder sign-in form |
| `/setup` | `app/admin/page.tsx` | Public (one-time) | Founder account creation |
| `/admin` | `app/admin/page.tsx` | SUPER_ADMIN | Founder console |
| `/admin/security` | `app/admin/security/page.tsx` | SUPER_ADMIN | Security settings |

### API Routes (19)
| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/setup` | GET, POST | Public | Check setup status / create founder |
| `/api/auth/setup-2fa-secret` | GET | Public | Generate TOTP secret for setup |
| `/api/auth/login` | POST | Public | Login with email/password |
| `/api/auth/verify-2fa` | POST | Public | Complete 2FA login |
| `/api/auth/logout` | POST | Public | Clear session |
| `/api/auth/me` | GET | Public | Get current user |
| `/api/admin/2fa/enroll` | GET, POST | SUPER_ADMIN | Enroll in 2FA |
| `/api/admin/2fa/disable` | POST | SUPER_ADMIN | Disable 2FA |
| `/api/admin/2fa/status` | GET | SUPER_ADMIN | Get 2FA status |
| `/api/admin/password` | POST | SUPER_ADMIN | Change password |
| `/api/admin/security` | GET, POST | SUPER_ADMIN | Change email/security Q&A |
| `/api/state` | GET | Session | Get full app state |
| `/api/mutations` | POST | Session | Financial mutations |
| `/api/achievements` | GET | Session | Get achievements |
| `/api/lessons` | GET | Session | Get lessons |
| `/api/lessons/[slug]` | GET | Session | Get specific lesson |
| `/api/lessons/complete` | POST | Session | Mark lesson complete |
| `/api/recommendations` | GET | Session | Get recommendations |
| `/api` | GET | Session | API health check |

## 4. Database Models (30)

| Model | Purpose | Key Fields |
|---|---|---|
| User | Auth + profiles | email, passwordHash, role, 2FA fields |
| SystemSettings | Singleton | isInitialized, superAdminUserId |
| AuditLog | Audit trail | action, userId, ipAddress, success |
| RateLimitEntry | DB-backed rate limiting | key, count, resetAt |
| TwoFactorChallenge | DB-backed 2FA | token, userId, expiresAt, consumed |
| Child | Family member | name, age, currentAmount, goalAmount |
| ParentProfile | Family member | name, role, avatarColor |
| Account | Bank account | childId, name, balance |
| Transaction | Financial record | childId, type, amount, timestamp |
| SpendingEntry | Spending log | ownerId, category, amount |
| SpendingCategory | Category template | name, budget |
| Investment | Investment record | childId, name, type, amountInvested |
| TokenLedgerEntry | Token economy | childId, type, tokens |
| Goal | Savings goal | ownerId, title, targetAmount |
| FamilySettings | Family config | annualTheme, monthlyQuote |
| Session | Session store | sessionToken, userId, expires |
| PasswordResetToken | Password reset | userId, token, expires |
| Notification | User notifications | userId, type, read |
| FileUpload | File tracking | familyId, uploaderId |
| Device | Device tracking | userId, deviceInfo |
| PushSubscription | Push notifications | userId, endpoint |
| EmailLog | Email tracking | to, subject, status |
| Achievement | Badge definitions | code, title, points |
| UserAchievement | Earned badges | userId, achievementId |
| Lesson | Curriculum | slug, title, content |
| LearningPath | Lesson grouping | slug, title |
| LessonProgress | User progress | userId, lessonId, status |
| QuizAttempt | Quiz scores | userId, lessonId, score |
| Recommendation | AI suggestions | userId, type, priority |
| SavingStreak | Streak tracking | childId, currentStreak |

## 5. Dependency Inventory

### Runtime Dependencies (69)
Key dependencies:
- next: 16.x (framework)
- react: 19.x (UI)
- prisma: 6.x (ORM)
- jose: JWT
- bcryptjs: password hashing
- otpauth: TOTP 2FA
- qrcode: QR code generation
- zustand: state management
- lucide-react: icons
- tailwindcss: styling
- z-ai-web-dev-sdk: AI coach

### Dev Dependencies (11)
- typescript: 5.x
- eslint: linting
- @types/*: type definitions

### Vulnerabilities
- **24 vulnerabilities** (2 low, 11 moderate, 11 high)
- Primary source: `next-auth` package (may be unused)
- `uuid` has vulnerable version
- **Recommendation:** Run `npm audit fix` to address non-breaking issues

## 6. Dead Code / Orphaned Files

### Truly Unused Files
| File | Status | Recommendation |
|---|---|---|
| `src/components/splash-screen.tsx` | Removed from layout, file still exists | Delete |
| `src/components/sw-register.tsx` | Removed from layout, file still exists | Delete |
| `src/server/permissions/*` (3 files) | Dead RBAC code, never wired to routes | Delete or wire up |

### Potentially Unused shadcn/ui Components (48 total)
The app uses custom CSS classes (`.surface-wood`, `.btn-gold`, `.input-editorial`) rather than shadcn/ui components for most UI. Most of the 48 shadcn/ui components are installed but not imported outside the `ui/` directory itself.

**Used shadcn components:** `toaster` (in layout.tsx)
**Unused shadcn components:** ~47 files that add bundle weight and maintenance burden.

### Unused Scripts
| Script | Status | Recommendation |
|---|---|---|
| `scripts/extract_chat.py` | One-time utility | Delete |
| `scripts/gen_architecture_part1.py` | One-time doc generator | Delete |
| `scripts/gen_architecture_part2.py` | One-time doc generator | Delete |
| `scripts/gen_architecture_part3.py` | One-time doc generator | Delete |
| `scripts/generate_audit_docx.py` | One-time doc generator | Delete |
| `scripts/generate_source_docx.py` | One-time doc generator | Delete |
| `scripts/seed_domain.py` | Seed script (already run) | Keep for re-seeding |

## 7. Code Quality Issues

### Files Exceeding 500 Lines
| File | Lines | Recommendation |
|---|---|---|
| `DashboardClient.tsx` | 1,379 | Split into smaller components |
| `goals.tsx` | 941 | Split into smaller components |
| `child-dashboard.tsx` | 751 | Split into smaller components |
| `education.service.ts` | 734 | Acceptable (service layer) |
| `ui/sidebar.tsx` | 726 | shadcn generated, acceptable |
| `modals.tsx` | 707 | Split into individual modal files |
| `auth.ts` | 669 | Acceptable (core auth module) |
| `parent-actions.tsx` | 591 | Split into individual action files |
| `store.ts` | 555 | Acceptable (Zustand store) |
| `charts.tsx` | 532 | Split into individual chart files |

### Inconsistent Naming
- **PascalCase:** `DashboardClient.tsx`, `LoginForm.tsx`, `SetupForm.tsx`, `SignOutButton.tsx`, `SecuritySettingsForm.tsx`
- **kebab-case:** `learn-tab.tsx`, `child-dashboard.tsx`, `parent-actions.tsx`, `theme-switcher.tsx`

Recommendation: Standardize on kebab-case for all files (Next.js convention).

### Intentional Code Duplication
- `src/lib/auth.ts` and `src/lib/auth-edge.ts` both contain `getSessionFromCookieHeader` and JWT secret loading. This is **intentional** — the Edge runtime (middleware) cannot import Node.js modules (Prisma, bcrypt, OTPAuth). The duplication is necessary but should be documented.

## 8. Circular Dependencies
None detected.

## 9. Environment Variables

| Variable | Required | Set | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | ✅ Neon PostgreSQL | Database connection |
| `JWT_SECRET` | Yes | ✅ 64 chars | JWT signing |
| `FOUNDER_EMAIL` | No | ✅ Set | Pre-fills /setup |
| `DISABLE_FOUNDER_RECOVERY` | No | ✅ true (prod) | Disables recover script |
| `NODE_ENV` | No | ✅ production | Runtime mode |

## 10. Repository Health Score

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Build success | 10/10 | 15% | 1.50 |
| TypeScript strict | 10/10 | 10% | 1.00 |
| ESLint clean | 10/10 | 10% | 1.00 |
| Test coverage | 0/10 | 15% | 0.00 |
| Dead code ratio | 6/10 | 10% | 0.60 |
| Code organization | 5/10 | 10% | 0.50 |
| Naming consistency | 6/10 | 5% | 0.30 |
| Dependency health | 6/10 | 10% | 0.60 |
| Documentation | 7/10 | 10% | 0.70 |
| Security posture | 8/10 | 5% | 0.40 |
| **TOTAL** | | **100%** | **6.60/10** |

**Repository Health Score: 6.6 / 10**
