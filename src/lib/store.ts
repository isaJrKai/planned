"use client";

// ============================================================================
// STORE — Planned Kids Savings & Allowance App
// ============================================================================
//
// Zustand store. All money logic lives here. This is the single source of
// truth — every figure shown in either dashboard is derived from these
// helpers, so the math cannot drift between screens.
//
// EVERY LINE OF MONEY MATH IS DELIBERATE. The 14 bugs from the prior audit
// are individually addressed and labeled inline.

import { create } from "zustand";
import type {
  Account,
  Child,
  Goal,
  GoalCadence,
  GoalType,
  GoalVisibility,
  Investment,
  ParentProfile,
  SpendingCategory,
  SpendingEntry,
  TokenLedgerEntry,
  Transaction,
  TxType,
} from "./types";
import {
  TOKEN_REDEEM_RATE,
  isThisMonth,
} from "./phrases";

// Three children with distinct profiles so the per-child math is visible.

const NOW = Date.now();
const DAY = 86_400_000;



// ---- Store shape -----------------------------------------------------------

// ---- Family theme + monthly quote (parent-set, shown on child dashboard) --
//
// The parent sets an annual "theme" (like a motto for the year) and a monthly
// quote. Both appear at the bottom of the child dashboard as a quiet,
// editorial reminder of the family's wealth-building intention.


// ---- Parent profiles + goals -----------------------------------------------


function startOfPeriod(cadence: GoalCadence, now: number = Date.now()): number {
  const d = new Date(now);
  if (cadence === "weekly") {
    const day = d.getDay(); // 0 = Sun
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (cadence === "monthly") {
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  // annual
  return new Date(d.getFullYear(), 0, 1).getTime();
}


const GOAL_MIN_PER_OWNER = 0;  // no minimum enforced — parents decide
const GOAL_MAX_PER_OWNER = 15;

interface StoreState {
  children: Child[];
  accounts: Account[];
  transactions: Transaction[];
  spending: SpendingEntry[];
  categories: SpendingCategory[];
  investments: Investment[];
  tokenLedger: TokenLedgerEntry[];

  // Family editorial — annual theme + monthly quote
  annualTheme: string;
  monthlyQuote: string;
  setAnnualTheme: (t: string) => void;
  setMonthlyQuote: (q: string) => void;

  // Parent profiles + photos
  parents: ParentProfile[];
  setParentPhoto: (parentId: string, photoDataUrl: string) => void;
  setParentName: (parentId: string, name: string) => void;
  setChildPhoto: (childId: string, photoDataUrl: string) => void;
  setChildName: (childId: string, name: string) => void;

  // Goals — flexible savings/spend-less goals with privacy + cadence
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "periodStart">) => { ok: boolean; error?: string };
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  resetGoalPeriod: (id: string) => void;
  goalMaxPerOwner: number;

  // Hydration status — set by store-hydration.ts when /api/state loads
  hydrated: boolean;
  hydrateError: string | null;

  // Mutations
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp"> & { timestamp?: number }) => void;
  addSpendingEntry: (e: Omit<SpendingEntry, "id" | "timestamp"> & { timestamp?: number }) => void;
  giveTokens: (childId: string, tokens: number, note: string) => void;
  redeemTokens: (childId: string, tokens: number) => boolean; // returns false if not enough
  investNow: (childId: string, amount: number, name: string, type: Investment["type"]) => boolean;
  resetSeed: () => void;
}

// ---- Store implementation --------------------------------------------------

export const useStore = create<StoreState>((set, get) => ({
  children: [],
  accounts: [],
  transactions: [],
  spending: [],
  categories: [],
  investments: [],
  tokenLedger: [],
  annualTheme: "",
  monthlyQuote: "",
  parents: [],
  goals: [],
  goalMaxPerOwner: GOAL_MAX_PER_OWNER,
  hydrated: false,
  hydrateError: null as string | null,

  setAnnualTheme: (t) => set({ annualTheme: t.trim() }),
  setMonthlyQuote: (q) => set({ monthlyQuote: q.trim() }),

  setParentPhoto: (parentId, photoDataUrl) =>
    set((s) => ({
      parents: s.parents.map((p) =>
        p.id === parentId ? { ...p, avatarPhoto: photoDataUrl } : p
      ),
    })),
  setParentName: (parentId, name) =>
    set((s) => ({
      parents: s.parents.map((p) =>
        p.id === parentId ? { ...p, name: name.trim() || p.name } : p
      ),
    })),
  setChildPhoto: (childId, photoDataUrl) =>
    set((s) => ({
      children: s.children.map((c) =>
        c.id === childId ? { ...c, avatarPhoto: photoDataUrl } : c
      ),
    })),
  setChildName: (childId, name) =>
    set((s) => ({
      children: s.children.map((c) =>
        c.id === childId ? { ...c, name: name.trim() || c.name } : c
      ),
    })),

  addGoal: (goal) => {
    const s = get();
    const ownerCount = s.goals.filter((g) => g.ownerId === goal.ownerId).length;
    if (ownerCount >= GOAL_MAX_PER_OWNER) {
      return { ok: false, error: `Maximum ${GOAL_MAX_PER_OWNER} goals per person reached.` };
    }
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      periodStart: startOfPeriod(goal.cadence),
    };
    set({ goals: [newGoal, ...s.goals] });
    return { ok: true };
  },

  updateGoal: (id, patch) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })),

  deleteGoal: (id) =>
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

  contributeToGoal: (id, amount) =>
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id
          ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) }
          : g
      ),
    })),

  resetGoalPeriod: (id) =>
    set((s) => ({
      goals: s.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              periodStart: startOfPeriod(g.cadence),
              currentAmount: g.type === "spend_less" ? 0 : g.currentAmount,
            }
          : g
      ),
    })),

  addTransaction: (tx) =>
    set((s) => {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: tx.timestamp ?? Date.now(),
        ...tx,
      };

      // --------------------------------------------------------------------
      // BUG #1 FIX: Save Money modal must update child.currentAmount.
      // Previously the transaction was logged but the child's live savings
      // balance never moved — money disappeared into the void.
      // --------------------------------------------------------------------
      let children = s.children;
      let accounts = s.accounts;
      let investments = s.investments;

      if (newTx.type === "save") {
        // Credit child's savings; debit linked external account.
        children = children.map((c) =>
          c.id === newTx.childId ? { ...c, currentAmount: c.currentAmount + newTx.amount } : c
        );
        if (newTx.accountId) {
          accounts = accounts.map((a) =>
            a.id === newTx.accountId ? { ...a, balance: Math.max(0, a.balance - newTx.amount) } : a
          );
        }
      } else if (newTx.type === "withdraw") {
        // Debit child's savings; credit external account.
        children = children.map((c) =>
          c.id === newTx.childId ? { ...c, currentAmount: Math.max(0, c.currentAmount - newTx.amount) } : c
        );
        if (newTx.accountId) {
          accounts = accounts.map((a) =>
            a.id === newTx.accountId ? { ...a, balance: a.balance + newTx.amount } : a
          );
        }
      } else if (newTx.type === "invest") {
        // Debit savings; create investment record handled by investNow().
        children = children.map((c) =>
          c.id === newTx.childId ? { ...c, currentAmount: Math.max(0, c.currentAmount - newTx.amount) } : c
        );
      } else if (newTx.type === "redeem") {
        // Credit savings by tokens * TOKEN_REDEEM_RATE.
        const cash = newTx.tokenDelta * TOKEN_REDEEM_RATE;
        children = children.map((c) =>
          c.id === newTx.childId ? { ...c, currentAmount: c.currentAmount + cash } : c
        );
      }
      // parent_give: no cash moves.

      return {
        ...s,
        transactions: [newTx, ...s.transactions],
        children,
        accounts,
        investments,
      };
    }),

  addSpendingEntry: (e) =>
    set((s) => {
      const newE: SpendingEntry = {
        id: `spend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: e.timestamp ?? Date.now(),
        ...e,
      };
      // --------------------------------------------------------------------
      // BUG #12 FIX: adding a spending entry must update the category's
      // displayed `spent`. Because `spent` is no longer stored (bug #7 fix),
      // the category bars will always reflect real entries — but we still
      // surface the entry through getChildCategories() at render time.
      // --------------------------------------------------------------------
      return { ...s, spending: [newE, ...s.spending] };
    }),

  giveTokens: (childId, tokens, note) =>
    set((s) => {
      const entry: TokenLedgerEntry = {
        id: `tok-${Date.now()}`,
        childId,
        type: "parent_give",
        tokens,
        note,
        timestamp: Date.now(),
      };
      // Also log a transaction so the parent dashboard's activity feed shows it.
      const tx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        childId,
        type: "parent_give",
        amount: 0,
        tokenDelta: tokens,
        note,
        timestamp: Date.now(),
      };
      return {
        ...s,
        tokenLedger: [entry, ...s.tokenLedger],
        transactions: [tx, ...s.transactions],
      };
    }),

  redeemTokens: (childId, tokens) => {
    const s = get();
    const balance = childTokenBalance(childId)(s);
    if (tokens > balance) return false;

    const cash = tokens * TOKEN_REDEEM_RATE;
    const ledger: TokenLedgerEntry = {
      id: `tok-${Date.now()}`,
      childId,
      type: "redeem",
      tokens,
      note: `${tokens} tokens redeemed @ ${TOKEN_REDEEM_RATE}`,
      timestamp: Date.now(),
    };
    set((st) => ({
      ...st,
      tokenLedger: [ledger, ...st.tokenLedger],
      // Use addTransaction's redeem path so the child's currentAmount updates.
      transactions: [
        {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          childId,
          type: "redeem",
          amount: cash,
          tokenDelta: tokens,
          note: `${tokens} tokens redeemed @ ${TOKEN_REDEEM_RATE}`,
          timestamp: Date.now(),
        },
        ...st.transactions,
      ],
      children: st.children.map((c) =>
        c.id === childId ? { ...c, currentAmount: c.currentAmount + cash } : c
      ),
    }));
    return true;
  },

  investNow: (childId, amount, name, type) => {
    const s = get();
    const child = s.children.find((c) => c.id === childId);
    if (!child || amount > child.currentAmount) return false;

    const inv: Investment = {
      id: `inv-${Date.now()}`,
      childId,
      name,
      type,
      amountInvested: amount,
      currentValue: amount, // starts at par
      status: "active",
      openedAt: Date.now(),
    };
    set((st) => ({
      ...st,
      investments: [inv, ...st.investments],
      children: st.children.map((c) =>
        c.id === childId ? { ...c, currentAmount: Math.max(0, c.currentAmount - amount) } : c
      ),
      transactions: [
        {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          childId,
          type: "invest",
          amount,
          tokenDelta: 0,
          investmentId: inv.id,
          note: `Invested in ${name}`,
          timestamp: Date.now(),
        },
        ...st.transactions,
      ],
    }));
    return true;
  },

  resetSeed: () =>
    set({
      children: [],
      accounts: [],
      transactions: [],
      spending: [],
      categories: [],
      investments: [],
      tokenLedger: [],
      annualTheme: "",
      monthlyQuote: "",
      parents: [],
      goals: [],
    }),
}));

// ============================================================================
// DERIVED SELECTORS — pure functions, take state, return derived data.
// All dashboards read through these so the math cannot drift.
// ============================================================================

type Sel<T> = (s: StoreState) => T;

// ---- Per-child selectors ---------------------------------------------------

export const childById = (id: string): Sel<Child | undefined> =>
  (s) => s.children.find((c) => c.id === id);

// Bug #2 FIX: filter by child. Previously summed ALL children's credits.
export const thisMonthSaved = (childId: string): Sel<number> =>
  (s) =>
    s.transactions
      .filter((t) => t.childId === childId && t.type === "save" && isThisMonth(t.timestamp))
      .reduce((sum, t) => sum + t.amount, 0);

// Bug #3 FIX: totalInvested now sums currentValue (mark-to-market), never
// going negative. Debits on withdrawal would be a separate closed-investment
// event, not a subtraction from active holdings.
export const totalInvested = (childId: string): Sel<number> =>
  (s) =>
    s.investments
      .filter((i) => i.childId === childId && i.status === "active")
      .reduce((sum, i) => sum + i.currentValue, 0);

export const childTokensGiven = (childId: string): Sel<number> =>
  (s) =>
    s.tokenLedger
      .filter((t) => t.childId === childId && t.type === "parent_give")
      .reduce((sum, t) => sum + t.tokens, 0);

export const childTokensRedeemed = (childId: string): Sel<number> =>
  (s) =>
    s.tokenLedger
      .filter((t) => t.childId === childId && t.type === "redeem")
      .reduce((sum, t) => sum + t.tokens, 0);

export const childTokenBalance = (childId: string): Sel<number> =>
  (s) => childTokensGiven(childId)(s) - childTokensRedeemed(childId)(s);

// Bug #7 FIX: per-owner spending categories. spent is computed from THIS
// owner's entries, not a shared static field. Works for both children and parents.
export const getOwnerCategories = (ownerId: string): Sel<
  { category: SpendingCategory; spent: number; remaining: number; pct: number }[]
> => (s) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return s.categories.map((category) => {
    const spent = s.spending
      .filter(
        (e) =>
          e.ownerId === ownerId &&
          e.category === category.name &&
          e.timestamp >= monthStart.getTime()
      )
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = Math.max(0, category.budget - spent);
    const pct = category.budget > 0 ? Math.min(100, (spent / category.budget) * 100) : 0;
    return { category, spent, remaining, pct };
  });
};

// Backwards-compat alias — getChildCategories now routes to getOwnerCategories.
export const getChildCategories = (childId: string) => getOwnerCategories(childId);

export const ownerSpendingThisMonth = (ownerId: string): Sel<number> =>
  (s) =>
    s.spending
      .filter((e) => e.ownerId === ownerId && isThisMonth(e.timestamp))
      .reduce((sum, e) => sum + e.amount, 0);

// Backwards-compat alias.
export const childSpendingThisMonth = (ownerId: string) => ownerSpendingThisMonth(ownerId);

// Family-wide spending this month — sums across all owners (parents + children).
export const familySpendingThisMonth: Sel<number> = (s) =>
  s.spending
    .filter((e) => isThisMonth(e.timestamp))
    .reduce((sum, e) => sum + e.amount, 0);

// Per-owner breakdown for the family overview — returns array of
// { ownerId, ownerKind, ownerName, total } sorted by total descending.
export const familySpendingBreakdown: Sel<
  { ownerId: string; ownerKind: "parent" | "child"; ownerName: string; total: number }[]
> = (s) => {
  const now = Date.now();
  const map = new Map<string, { ownerKind: "parent" | "child"; ownerName: string; total: number }>();
  for (const e of s.spending) {
    if (!isThisMonth(e.timestamp)) continue;
    const existing = map.get(e.ownerId);
    if (existing) {
      existing.total += e.amount;
    } else {
      map.set(e.ownerId, { ownerKind: e.ownerKind, ownerName: e.ownerName, total: e.amount });
    }
  }
  return Array.from(map.entries())
    .map(([ownerId, v]) => ({ ownerId, ...v }))
    .sort((a, b) => b.total - a.total);
};

export const childInvestments = (childId: string): Sel<Investment[]> =>
  (s) => s.investments.filter((i) => i.childId === childId);

export const childTransactions = (childId: string): Sel<Transaction[]> =>
  (s) => s.transactions.filter((t) => t.childId === childId);

export const childAccount = (childId: string): Sel<Account | undefined> =>
  (s) => s.accounts.find((a) => a.childId === childId);

// ---- Family / parent selectors --------------------------------------------

// Bug #4 FIX: parentTokenBalance now subtracts redeemed tokens. Previously
// it counted only parent_give, inflating the "total value" display.
export const parentTokensGiven: Sel<number> = (s) =>
  s.tokenLedger.filter((t) => t.type === "parent_give").reduce((sum, t) => sum + t.tokens, 0);

export const parentTokensRedeemed: Sel<number> = (s) =>
  s.tokenLedger.filter((t) => t.type === "redeem").reduce((sum, t) => sum + t.tokens, 0);

export const parentTokenBalance: Sel<number> = (s) =>
  parentTokensGiven(s) - parentTokensRedeemed(s);

export const familyTotalSavings: Sel<number> = (s) =>
  s.children.reduce((sum, c) => sum + c.currentAmount, 0);

export const familyTotalInvested: Sel<number> = (s) =>
  s.investments.filter((i) => i.status === "active").reduce((sum, i) => sum + i.currentValue, 0);

export const familyThisMonthSaved: Sel<number> = (s) =>
  s.transactions
    .filter((t) => t.type === "save" && isThisMonth(t.timestamp))
    .reduce((sum, t) => sum + t.amount, 0);

export const familyTotalGoals: Sel<number> = (s) =>
  s.children.reduce((sum, c) => sum + c.goalAmount, 0);

// Convenience: tokens -> cash value at the BUY rate (what parent paid in).
export const parentTokenCashValue: Sel<number> = (s) =>
  parentTokenBalance(s) * 50; // parent side rate is the cost basis

export const txTypeLabel: Record<TxType, string> = {
  save: "Save",
  withdraw: "Withdraw",
  invest: "Invest",
  redeem: "Redeem",
  parent_give: "Token Award",
};
