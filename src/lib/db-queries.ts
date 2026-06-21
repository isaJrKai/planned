// ============================================================================
// DB QUERIES — server-side data access layer
// ============================================================================
// All Prisma queries live here. API routes call these functions. The shape
// of the returned objects matches the Zustand store types exactly so the
// client hydration layer is a clean 1:1 mapping.
// ============================================================================

import { db } from "./db";
import type {
  Account,
  Child,
  Goal,
  Investment,
  ParentProfile,
  SpendingCategory,
  SpendingEntry,
  TokenLedgerEntry,
  Transaction,
  TxType,
} from "./types";

// ---- Helpers ---------------------------------------------------------------
// Prisma returns BigInt for BigInt columns; we serialize as Number for JSON
// (timestamps fit safely in JS Number range until year 2255).

function toNumber(b: bigint): number {
  return Number(b);
}

// ---- Full state hydration --------------------------------------------------

export interface AppState {
  children: Child[];
  parents: ParentProfile[];
  accounts: Account[];
  transactions: Transaction[];
  spending: SpendingEntry[];
  categories: SpendingCategory[];
  investments: Investment[];
  tokenLedger: TokenLedgerEntry[];
  goals: Goal[];
  annualTheme: string;
  monthlyQuote: string;
}

export async function getFullState(): Promise<AppState> {
  const [
    children,
    parents,
    accounts,
    transactions,
    spending,
    categories,
    investments,
    tokenLedger,
    goals,
    settings,
  ] = await Promise.all([
    db.child.findMany(),
    db.parentProfile.findMany(),
    db.account.findMany(),
    db.transaction.findMany({ orderBy: { timestamp: "desc" } }),
    db.spendingEntry.findMany({ orderBy: { timestamp: "desc" } }),
    db.spendingCategory.findMany(),
    db.investment.findMany(),
    db.tokenLedgerEntry.findMany({ orderBy: { timestamp: "desc" } }),
    db.goal.findMany({ orderBy: { createdAt: "desc" } }),
    db.familySettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return {
    children: children.map((c) => ({
      id: c.id,
      name: c.name,
      age: c.age,
      avatarColor: c.avatarColor,
      avatarPhoto: c.avatarPhoto ?? undefined,
      currentAmount: c.currentAmount,
      goalAmount: c.goalAmount,
      goalName: c.goalName,
    })),
    parents: parents.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      avatarColor: p.avatarColor,
      avatarPhoto: p.avatarPhoto ?? undefined,
    })),
    accounts: accounts.map((a) => ({
      id: a.id,
      childId: a.childId,
      name: a.name,
      balance: a.balance,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      childId: t.childId,
      type: t.type as TxType,
      amount: t.amount,
      tokenDelta: t.tokenDelta,
      accountId: t.accountId ?? undefined,
      investmentId: t.investmentId ?? undefined,
      note: t.note,
      timestamp: toNumber(t.timestamp),
    })),
    spending: spending.map((e) => ({
      id: e.id,
      ownerId: e.ownerId,
      ownerKind: e.ownerKind as "parent" | "child",
      ownerName: e.ownerName,
      category: e.category,
      amount: e.amount,
      note: e.note,
      timestamp: toNumber(e.timestamp),
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      budget: c.budget,
    })),
    investments: investments.map((i) => ({
      id: i.id,
      childId: i.childId,
      name: i.name,
      type: i.type as Investment["type"],
      amountInvested: i.amountInvested,
      currentValue: i.currentValue,
      status: i.status as "active" | "closed",
      openedAt: toNumber(i.openedAt),
    })),
    tokenLedger: tokenLedger.map((t) => ({
      id: t.id,
      childId: t.childId,
      type: t.type as "parent_give" | "redeem",
      tokens: t.tokens,
      note: t.note,
      timestamp: toNumber(t.timestamp),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      ownerId: g.ownerId,
      ownerKind: g.ownerKind as "parent" | "child",
      ownerName: g.ownerName,
      title: g.title,
      type: g.type as "save" | "spend_less",
      cadence: g.cadence as "weekly" | "monthly" | "annual",
      visibility: g.visibility as "private" | "revealed",
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      createdAt: g.createdAt.getTime(),
      periodStart: toNumber(g.periodStart),
      note: g.note ?? undefined,
    })),
    annualTheme: settings?.annualTheme ?? "",
    monthlyQuote: settings?.monthlyQuote ?? "",
  };
}

// ---- Mutations -------------------------------------------------------------

export async function addTransaction(input: {
  childId: string;
  type: TxType;
  amount: number;
  tokenDelta: number;
  accountId?: string;
  investmentId?: string;
  note: string;
  timestamp?: number;
}) {
  const ts = input.timestamp ?? Date.now();
  const tx = await db.transaction.create({
    data: {
      childId: input.childId,
      type: input.type,
      amount: input.amount,
      tokenDelta: input.tokenDelta,
      accountId: input.accountId ?? null,
      investmentId: input.investmentId ?? null,
      note: input.note,
      timestamp: BigInt(ts),
    },
  });

  // Update child's currentAmount based on type
  const child = await db.child.findUnique({ where: { id: input.childId } });
  if (child) {
    let newAmount = child.currentAmount;
    if (input.type === "save" || input.type === "redeem") {
      newAmount += input.amount;
    } else if (input.type === "invest" || input.type === "withdraw") {
      newAmount = Math.max(0, newAmount - input.amount);
    }
    await db.child.update({
      where: { id: input.childId },
      data: { currentAmount: newAmount },
    });
  }

  // Update linked account balance for save/withdraw
  if (input.accountId) {
    const acct = await db.account.findUnique({ where: { id: input.accountId } });
    if (acct) {
      let newBalance = acct.balance;
      if (input.type === "save") newBalance = Math.max(0, newBalance - input.amount);
      else if (input.type === "withdraw") newBalance += input.amount;
      await db.account.update({
        where: { id: input.accountId },
        data: { balance: newBalance },
      });
    }
  }

  return tx;
}

export async function addSpendingEntry(input: {
  ownerId: string;
  ownerKind: "parent" | "child";
  ownerName: string;
  category: string;
  amount: number;
  note: string;
  timestamp?: number;
}) {
  const ts = input.timestamp ?? Date.now();
  return db.spendingEntry.create({
    data: {
      ownerId: input.ownerId,
      ownerKind: input.ownerKind,
      ownerName: input.ownerName,
      category: input.category,
      amount: input.amount,
      note: input.note,
      timestamp: BigInt(ts),
      childId: input.ownerKind === "child" ? input.ownerId : null,
      parentId: input.ownerKind === "parent" ? input.ownerId : null,
    },
  });
}

export async function giveTokens(childId: string, tokens: number, note: string) {
  const ts = Date.now();
  await db.tokenLedgerEntry.create({
    data: {
      childId,
      type: "parent_give",
      tokens,
      note,
      timestamp: BigInt(ts),
    },
  });
  await db.transaction.create({
    data: {
      childId,
      type: "parent_give",
      amount: 0,
      tokenDelta: tokens,
      note,
      timestamp: BigInt(ts),
    },
  });
}

export async function redeemTokens(childId: string, tokens: number, cashValue: number) {
  const ts = Date.now();
  await db.tokenLedgerEntry.create({
    data: {
      childId,
      type: "redeem",
      tokens,
      note: `${tokens} tokens redeemed`,
      timestamp: BigInt(ts),
    },
  });
  await db.transaction.create({
    data: {
      childId,
      type: "redeem",
      amount: cashValue,
      tokenDelta: tokens,
      note: `${tokens} tokens redeemed`,
      timestamp: BigInt(ts),
    },
  });
  // Credit child's savings
  const child = await db.child.findUnique({ where: { id: childId } });
  if (child) {
    await db.child.update({
      where: { id: childId },
      data: { currentAmount: child.currentAmount + cashValue },
    });
  }
}

export async function investNow(
  childId: string,
  amount: number,
  name: string,
  type: Investment["type"]
) {
  const child = await db.child.findUnique({ where: { id: childId } });
  if (!child || amount > child.currentAmount) return null;
  const ts = Date.now();
  const inv = await db.investment.create({
    data: {
      childId,
      name,
      type,
      amountInvested: amount,
      currentValue: amount,
      status: "active",
      openedAt: BigInt(ts),
    },
  });
  await db.child.update({
    where: { id: childId },
    data: { currentAmount: Math.max(0, child.currentAmount - amount) },
  });
  await db.transaction.create({
    data: {
      childId,
      type: "invest",
      amount,
      tokenDelta: 0,
      investmentId: inv.id,
      note: `Invested in ${name}`,
      timestamp: BigInt(ts),
    },
  });
  return inv;
}

export async function createGoal(input: {
  ownerId: string;
  ownerKind: "parent" | "child";
  ownerName: string;
  title: string;
  type: "save" | "spend_less";
  cadence: "weekly" | "monthly" | "annual";
  visibility: "private" | "revealed";
  targetAmount: number;
  note?: string;
}) {
  const ts = Date.now();
  const periodStart = (() => {
    const d = new Date();
    if (input.cadence === "weekly") {
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    if (input.cadence === "monthly") {
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }
    return new Date(d.getFullYear(), 0, 1).getTime();
  })();
  return db.goal.create({
    data: {
      ownerId: input.ownerId,
      ownerKind: input.ownerKind,
      ownerName: input.ownerName,
      title: input.title,
      type: input.type,
      cadence: input.cadence,
      visibility: input.visibility,
      targetAmount: input.targetAmount,
      currentAmount: 0,
      periodStart: BigInt(periodStart),
      note: input.note ?? null,
      childId: input.ownerKind === "child" ? input.ownerId : null,
      parentId: input.ownerKind === "parent" ? input.ownerId : null,
    },
  });
}

export async function updateGoal(id: string, patch: Partial<{
  title: string;
  type: "save" | "spend_less";
  cadence: "weekly" | "monthly" | "annual";
  visibility: "private" | "revealed";
  targetAmount: number;
  currentAmount: number;
  note: string | null;
}>) {
  return db.goal.update({ where: { id }, data: patch });
}

export async function deleteGoal(id: string) {
  return db.goal.delete({ where: { id } });
}

export async function contributeToGoal(id: string, amount: number) {
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return null;
  return db.goal.update({
    where: { id },
    data: { currentAmount: Math.max(0, goal.currentAmount + amount) },
  });
}

export async function setFamilySettings(patch: { annualTheme?: string; monthlyQuote?: string }) {
  return db.familySettings.upsert({
    where: { id: "singleton" },
    update: patch,
    create: { id: "singleton", ...patch },
  });
}

export async function setParentPhoto(parentId: string, photoDataUrl: string) {
  return db.parentProfile.update({
    where: { id: parentId },
    data: { avatarPhoto: photoDataUrl },
  });
}

export async function setParentName(parentId: string, name: string) {
  return db.parentProfile.update({
    where: { id: parentId },
    data: { name: name.trim() || undefined },
  });
}

export async function setChildPhoto(childId: string, photoDataUrl: string) {
  return db.child.update({
    where: { id: childId },
    data: { avatarPhoto: photoDataUrl },
  });
}

export async function setChildName(childId: string, name: string) {
  return db.child.update({
    where: { id: childId },
    data: { name: name.trim() || undefined },
  });
}
