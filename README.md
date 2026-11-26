# Planned — Family Savings & Allowance

Planned helps families teach children practical money habits through savings, goals, allowances, spending, financial literacy and family-level financial visibility.

## Stack

- **Web:** Next.js App Router, React and TypeScript
- **Database:** PostgreSQL on Neon
- **Data access:** Drizzle ORM with the Neon serverless WebSocket driver
- **Validation:** Zod
- **Tests:** Vitest
- **Hosting:** Vercel

## Local development

Requirements: Node.js 22.12+ and npm.

```bash
npm install
cp .env.example .env
# Set DATABASE_URL and APP_SECRET in .env
npm run dev
```

Open http://localhost:3000.

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run the Vitest suite |
| `npm run test:unit` | Run the unit-test subset used by CI |
| `npm run test:integration` | Run database-backed isolation tests |
| `npm run test:watch` | Run Vitest in watch mode |

Database integration tests require `TEST_DATABASE_URL` (preferred) or `DATABASE_URL`. They are skipped when neither is configured. Use a dedicated test database, never production.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon/PostgreSQL connection string |
| `APP_SECRET` | Yes in production | Dedicated random encryption secret, minimum 32 characters; do not reuse database credentials |
| `TEST_DATABASE_URL` | For integration tests | Isolated PostgreSQL test database |
| `FOUNDER_EMAIL` | Optional | Prefills the account setup form, where supported |
| `DISABLE_FOUNDER_RECOVERY` | Optional | Set to `true` to disable any configured founder recovery workflow |

Generate an `APP_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Production startup fails if `APP_SECRET` is missing or shorter than 32 characters. Keep it stable between deployments: changing it can make previously encrypted provider credentials unreadable. The encryption module retains a legacy decryption fallback for data encrypted by older builds using `DATABASE_URL`; new encryption always uses `APP_SECRET`.

## Authentication and security

- Passwords are hashed with Node.js scrypt.
- Sessions are stored in PostgreSQL; the browser receives an HttpOnly, SameSite=Lax cookie with a 14-day expiry.
- Session tokens are stored as SHA-256 hashes and can be revoked server-side.
- Login failures increment a database counter atomically; eight failed attempts trigger a 15-minute account lockout.
- Mutating API requests apply an Origin/Host check.
- The current general-purpose rate limiter in `src/lib/api.ts` is process-local. It is not a distributed rate limiter and should not be treated as a global per-IP control on serverless deployments.

## Data model

The Drizzle schema lives in `src/db/schema.ts`. Core tables include users, sessions, families, family members, accounts, transactions, goals, allowance rules, approval requests, family settings, lessons, achievements, journal entries and audit logs.

Financial amounts are stored in PostgreSQL BIGINT columns. The current Drizzle mapping uses JavaScript numbers, so application values must remain within `Number.MAX_SAFE_INTEGER`. A future end-to-end bigint/string migration is recommended before supporting amounts beyond that limit.

Transactions have a family-scoped unique idempotency key. Account balances are cached alongside transaction records and should be reconciled against the ledger.

### Database changes

The schema source is `src/db/schema.ts`. The current `package.json` does not define Drizzle migration or push scripts. Do not use old Prisma commands from archived documentation. Before deploying schema changes, use the project's approved SQL migration process and verify the resulting database schema.

## Deployment

The production project is hosted on Vercel. Configure at least:

- `DATABASE_URL`
- `APP_SECRET` (random, stable, 32+ characters)
- Any optional provider credentials required by the enabled features

Deploy from the verified production branch only after build, typecheck, unit tests, database migration review and a preview smoke test pass.

## Important maintenance notes

- Never commit database connection strings, API keys or other credentials.
- Removing a credential from the latest source does not remove it from Git history. Rotate any credential that has ever been committed.
- Use a separate Neon database for integration tests.
- Review transaction concurrency, idempotency and family scoping whenever adding financial mutations.
