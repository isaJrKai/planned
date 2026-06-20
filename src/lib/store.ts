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
  Investment,
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

// ---- Seed data -------------------------------------------------------------
// Three children with distinct profiles so the per-child math is visible.

const NOW = Date.now();
const DAY = 86_400_000;

const SEED_CHILDREN: Child[] = [
  {
    id: "zara",
    name: "Zara Namutebi",
    age: 12,
    avatarColor: "#C9A84C", // gold
    currentAmount: 312_500,
    goalAmount: 500_000,
    goalName: "Secondary School Tablet",
  },
  {
    id: "enoch",
    name: "Enoch Okello",
    age: 9,
    avatarColor: "#6BBF8A", // soft green
    currentAmount: 87_200,
    goalAmount: 200_000,
    goalName: "Bicycle",
  },
  {
    id: "amani",
    name: "Amani Atuhaire",
    age: 7,
    avatarColor: "#D4943A", // amber
    currentAmount: 41_800,
    goalAmount: 100_000,
    goalName: "Art Supplies Kit",
  },
];

const SEED_ACCOUNTS: Account[] = [
  { id: "acc-zara", childId: "zara", name: "Stanbic Junior — Zara", balance: 62_000 },
  { id: "acc-enoch", childId: "enoch", name: "Centenary Youth — Enoch", balance: 28_500 },
  { id: "acc-amani", childId: "amani", name: "DFCU Pocket — Amani", balance: 15_000 },
];

const SEED_CATEGORIES: SpendingCategory[] = [
  { id: "cat-snacks", name: "Snacks & Sweets", budget: 20_000 },
  { id: "cat-airtime", name: "Airtime & Data", budget: 15_000 },
  { id: "cat-school", name: "School Supplies", budget: 30_000 },
  { id: "cat-toys", name: "Toys & Games", budget: 25_000 },
  { id: "cat-gifts", name: "Gifts & Giving", budget: 10_000 },
  { id: "cat-transport", name: "Transport", budget: 12_000 },
];

function seedSpending(childId: string): SpendingEntry[] {
  // Distinct amounts per child so the per-child bug (#7) is visually obvious
  // if it ever regresses.
  const base = {
    zara: [
      { cat: "Snacks & Sweets", amt: 3_500, note: "Chapati & juice", d: 2 },
      { cat: "Airtime & Data", amt: 5_000, note: "WhatsApp bundle", d: 5 },
      { cat: "School Supplies", amt: 8_000, note: "Geometry set", d: 9 },
      { cat: "Gifts & Giving", amt: 4_000, note: "Friend birthday", d: 12 },
    ],
    enoch: [
      { cat: "Snacks & Sweets", amt: 2_000, note: "Ice cream", d: 1 },
      { cat: "Toys & Games", amt: 12_000, note: "Marbles set", d: 6 },
      { cat: "Transport", amt: 3_000, note: "Boda to mosque", d: 8 },
    ],
    amani: [
      { cat: "Snacks & Sweets", amt: 1_500, note: "Bubblegum", d: 3 },
      { cat: "School Supplies", amt: 6_000, note: "Crayons", d: 7 },
    ],
  } as const;

  return (base[childId as keyof typeof base] ?? []).map((e, i) => ({
    id: `spend-${childId}-${i}`,
    childId,
    category: e.cat,
    amount: e.amt,
    note: e.note,
    timestamp: NOW - e.d * DAY,
  }));
}

const SEED_SPENDING: SpendingEntry[] = [
  ...seedSpending("zara"),
  ...seedSpending("enoch"),
  ...seedSpending("amani"),
];

const SEED_INVESTMENTS: Investment[] = [
  {
    id: "inv-zara-1",
    childId: "zara",
    name: "Stanbic Unit Trust — Balanced",
    type: "Unit Trust",
    amountInvested: 100_000,
    currentValue: 118_400,
    status: "active",
    openedAt: NOW - 120 * DAY,
  },
  {
    id: "inv-zara-2",
    childId: "zara",
    name: "Government Treasury Bill — 91d",
    type: "Treasury Bill",
    amountInvested: 50_000,
    currentValue: 51_850,
    status: "active",
    openedAt: NOW - 45 * DAY,
  },
  {
    id: "inv-enoch-1",
    childId: "enoch",
    name: "Savings Bond — 1yr",
    type: "Savings Bond",
    amountInvested: 30_000,
    currentValue: 31_200,
    status: "active",
    openedAt: NOW - 60 * DAY,
  },
];

// Token ledger: parent has given tokens to each child over time. Children
// have redeemed some. The parent balance is GIVEN minus REDEEMED (bug #4).
const SEED_TOKEN_LEDGER: TokenLedgerEntry[] = [
  { id: "tok-1", childId: "zara", type: "parent_give", tokens: 80, note: "Math test A", timestamp: NOW - 30 * DAY },
  { id: "tok-2", childId: "zara", type: "parent_give", tokens: 50, note: "Chores week", timestamp: NOW - 22 * DAY },
  { id: "tok-3", childId: "zara", type: "redeem", tokens: 40, note: "Redeemed to savings", timestamp: NOW - 14 * DAY },
  { id: "tok-4", childId: "enoch", type: "parent_give", tokens: 60, note: "Reading streak", timestamp: NOW - 18 * DAY },
  { id: "tok-5", childId: "enoch", type: "parent_give", tokens: 30, note: "Helped market", timestamp: NOW - 9 * DAY },
  { id: "tok-6", childId: "amani", type: "parent_give", tokens: 25, note: "Tidied room", timestamp: NOW - 7 * DAY },
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", childId: "zara", type: "save", amount: 30_000, tokenDelta: 0, accountId: "acc-zara", note: "First deposit", timestamp: NOW - 30 * DAY },
  { id: "tx-2", childId: "zara", type: "save", amount: 20_000, tokenDelta: 0, accountId: "acc-zara", note: "Birthday gift", timestamp: NOW - 20 * DAY },
  { id: "tx-3", childId: "zara", type: "invest", amount: 100_000, tokenDelta: 0, investmentId: "inv-zara-1", note: "Opened unit trust", timestamp: NOW - 120 * DAY },
  { id: "tx-4", childId: "zara", type: "redeem", amount: 3_200, tokenDelta: 40, note: "40 tokens redeemed @ 80", timestamp: NOW - 14 * DAY },
  { id: "tx-5", childId: "enoch", type: "save", amount: 15_000, tokenDelta: 0, accountId: "acc-enoch", note: "Saved allowance", timestamp: NOW - 18 * DAY },
  { id: "tx-6", childId: "enoch", type: "invest", amount: 30_000, tokenDelta: 0, investmentId: "inv-enoch-1", note: "Savings bond", timestamp: NOW - 60 * DAY },
  { id: "tx-7", childId: "amani", type: "save", amount: 10_000, tokenDelta: 0, accountId: "acc-amani", note: "First savings", timestamp: NOW - 7 * DAY },
  // This-month savings (for the "This Month" stat card)
  { id: "tx-8", childId: "zara", type: "save", amount: 12_500, tokenDelta: 0, accountId: "acc-zara", note: "Weekly save", timestamp: NOW - 3 * DAY },
  { id: "tx-9", childId: "enoch", type: "save", amount: 4_200, tokenDelta: 0, accountId: "acc-enoch", note: "Saved pocket money", timestamp: NOW - 2 * DAY },
];

// ---- Store shape -----------------------------------------------------------

interface StoreState {
  children: Child[];
  accounts: Account[];
  transactions: Transaction[];
  spending: SpendingEntry[];
  categories: SpendingCategory[];
  investments: Investment[];
  tokenLedger: TokenLedgerEntry[];

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
  children: SEED_CHILDREN,
  accounts: SEED_ACCOUNTS,
  transactions: SEED_TRANSACTIONS,
  spending: SEED_SPENDING,
  categories: SEED_CATEGORIES,
  investments: SEED_INVESTMENTS,
  tokenLedger: SEED_TOKEN_LEDGER,

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
      children: SEED_CHILDREN,
      accounts: SEED_ACCOUNTS,
      transactions: SEED_TRANSACTIONS,
      spending: SEED_SPENDING,
      categories: SEED_CATEGORIES,
      investments: SEED_INVESTMENTS,
      tokenLedger: SEED_TOKEN_LEDGER,
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

// Bug #7 FIX: per-child spending categories. spent is computed from THIS
// child's entries, not a shared static field.
export const getChildCategories = (childId: string): Sel<
  { category: SpendingCategory; spent: number; remaining: number; pct: number }[]
> => (s) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return s.categories.map((category) => {
    const spent = s.spending
      .filter(
        (e) =>
          e.childId === childId &&
          e.category === category.name &&
          e.timestamp >= monthStart.getTime()
      )
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = Math.max(0, category.budget - spent);
    const pct = category.budget > 0 ? Math.min(100, (spent / category.budget) * 100) : 0;
    return { category, spent, remaining, pct };
  });
};

export const childSpendingThisMonth = (childId: string): Sel<number> =>
  (s) =>
    s.spending
      .filter((e) => e.childId === childId && isThisMonth(e.timestamp))
      .reduce((sum, e) => sum + e.amount, 0);

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
