# Planned — Family Savings & Allowance App

A Next.js 16 + TypeScript + Tailwind CSS + Prisma/SQLite web app for families to teach children disciplined wealth-building through savings, investments, tokens, spending tracking, and goals.

## Quick Start

```bash
# 1. Extract the archive
tar xzf planned-source-light.tar.gz
cd planned-source

# 2. Install dependencies
bun install   # or: npm install

# 3. Set up the database
cp .env.example .env   # or create .env with: DATABASE_URL=file:./db/custom.db
bun run db:push        # creates SQLite database + tables

# 4. Seed demo data
bun run scripts/seed.ts

# 5. Start the dev server
bun run dev            # or: npm run dev

# 6. Open http://localhost:3000
```

## What's Included

- **Parent dashboard** with 7 tabs: Overview, Children, Transactions, Investments, Tokens, Goals, Settings
- **Child dashboard** with 4 tabs: Overview, Spending, Worksheet, Investments
- **4 themes**: Onyx (dark), Ivory (light), Blush (pink), Oxblood (red) — switchable via topbar
- **Goals feature**: savings + spend-less goals, weekly/monthly/annual cadence, private/revealed privacy, max 15 per person
- **Profile photos**: upload for parents + children, stored as base64 in DB
- **Family editorial**: parent sets annual theme + monthly quote, shown at bottom of child dashboard
- **Editorial SVG charts**: savings trend line, distribution donut, cash flow bars, goal radials
- **Search** (Cmd+K) + **Notifications** dropdown + **floating Log Spend FAB**
- **Token economy**: parent buys at UGX 50/token, child redeems at UGX 80/token (60% incentive)
- **Prisma + SQLite backend**: all data persists across refreshes

## Tech Stack

- Next.js 16 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui components
- Prisma ORM + SQLite
- Zustand (client state) with API hydration
- Playfair Display + Inter + JetBrains Mono fonts

## File Structure

```
src/
  app/
    api/
      state/route.ts        GET — returns full app state from DB
      mutations/route.ts    POST — handles all write operations
    globals.css             4-theme design system + editorial styles
    layout.tsx              fonts + theme init script
    page.tsx                parent dashboard (7 tabs)
  lib/
    db.ts                   Prisma client singleton
    db-queries.ts           server-side data access layer
    store.ts                Zustand store (client state + optimistic updates)
    store-hydration.ts      hydrates store from /api/state on mount
    mutations.ts            persisted mutation wrappers (optimistic + API)
    types.ts                TypeScript domain model
    phrases.ts              constants, formatters, encouragement quotes
  components/
    modals.tsx              SaveMoney, GiveTokens, AddSpending, RedeemTokens, InvestmentDetail
    child-dashboard.tsx     child view with 4 tabs
    goals.tsx               GoalsTab + GoalModal + ContributeModal
    charts.tsx              4 editorial SVG charts
    avatar.tsx              profile photo upload component
    parent-actions.tsx      SearchOverlay + NotificationsButton + LogSpendFab
    theme-switcher.tsx      4-theme switcher
    parent-quote-editor.tsx annual theme + monthly quote editor
    family-theme-footer.tsx footer shown on child dashboard
    ui/                     shadcn/ui components
prisma/
  schema.prisma             10 models matching the TypeScript types
scripts/
  seed.ts                   populates DB with demo data
```

## Database

SQLite at `db/custom.db`. 10 tables:
- Child, ParentProfile, Account, Transaction, SpendingCategory, SpendingEntry
- Investment, TokenLedgerEntry, Goal, FamilySettings

To reset: delete `db/custom.db` and run `bun run db:push && bun run scripts/seed.ts`.

## Notes

- All money is in UGX (Ugandan Shillings) as integer
- All timestamps are BigInt milliseconds since epoch
- The app uses optimistic updates (UI updates instantly) then confirms with the server
- Theme persists to localStorage (loaded before paint to avoid flash)
- The audit document is at /Planned_App_Audit.pdf (downloadable from the running app)
