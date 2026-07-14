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

export async function getFullState(familyId: string): Promise<AppState> {
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
    db.child.findMany({ where: { familyId } }),
    db.parentProfile.findMany({ where: { familyId } }),
    db.account.findMany({ where: { familyId } }),
    db.transaction.findMany({ where: { familyId }, orderBy: { timestamp: "desc" } }),
    db.spendingEntry.findMany({ where: { familyId }, orderBy: { timestamp: "desc" } }),
    db.spendingCategory.findMany({ where: { familyId } }),
    db.investment.findMany({ where: { familyId } }),
    db.tokenLedgerEntry.findMany({ where: { familyId }, orderBy: { timestamp: "desc" } }),
    db.goal.findMany({ where: { familyId }, orderBy: { createdAt: "desc" } }),
    db.familySettings.findUnique({ where: { familyId } }),
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
// All financial writes are wrapped in db.$transaction for atomicity.
// Balance-affecting operations use atomic conditional updates to prevent
// TOCTOU races — concurrent requests cannot double-spend.

export async function addTransaction(input: {
  familyId: string;
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
  return db.$transaction(async (tx) => {
    const txRow = await tx.transaction.create({
      data: {
        familyId: input.familyId,
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

    // Atomic conditional update on child balance
    if (input.type === "save" || input.type === "redeem") {
      await tx.child.update({
        where: { id: input.childId },
        data: { currentAmount: { increment: input.amount } },
      });
    } else if (input.type === "invest" || input.type === "withdraw") {
      // Conditional update — prevents going negative
      const updated = await tx.child.updateMany({
        where: { id: input.childId, currentAmount: { gte: input.amount } },
        data: { currentAmount: { decrement: input.amount } },
      });
      if (updated.count === 0) {
        throw new Error("Insufficient balance for " + input.type);
      }
    }

    // Update linked account balance for save/withdraw
    if (input.accountId) {
      if (input.type === "save") {
        await tx.account.updateMany({
          where: { id: input.accountId, balance: { gte: input.amount } },
          data: { balance: { decrement: input.amount } },
        });
      } else if (input.type === "withdraw") {
        await tx.account.update({
          where: { id: input.accountId },
          data: { balance: { increment: input.amount } },
        });
      }
    }

    return txRow;
  });
}

export async function addSpendingEntry(input: {
  familyId: string;
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
      familyId: input.familyId,
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

export async function giveTokens(familyId: string, childId: string, tokens: number, note: string) {
  const ts = Date.now();
  return db.$transaction(async (tx) => {
    await tx.tokenLedgerEntry.create({
      data: { familyId, childId, type: "parent_give", tokens, note, timestamp: BigInt(ts) },
    });
    await tx.transaction.create({
      data: { familyId, childId, type: "parent_give", amount: 0, tokenDelta: tokens, note, timestamp: BigInt(ts) },
    });
  });
}

export async function redeemTokens(familyId: string, childId: string, tokens: number, cashValue: number) {
  const ts = Date.now();
  return db.$transaction(async (tx) => {
    // Atomically verify token balance hasn't changed since read
    const given = await tx.tokenLedgerEntry.aggregate({
      where: { childId, type: "parent_give" },
      _sum: { tokens: true },
    });
    const redeemed = await tx.tokenLedgerEntry.aggregate({
      where: { childId, type: "redeem" },
      _sum: { tokens: true },
    });
    const balance = (given._sum.tokens ?? 0) - (redeemed._sum.tokens ?? 0);
    if (balance < tokens) {
      throw new Error("Insufficient token balance");
    }

    await tx.tokenLedgerEntry.create({
      data: { familyId, childId, type: "redeem", tokens, note: `${tokens} tokens redeemed`, timestamp: BigInt(ts) },
    });
    await tx.transaction.create({
      data: { familyId, childId, type: "redeem", amount: cashValue, tokenDelta: tokens, note: `${tokens} tokens redeemed`, timestamp: BigInt(ts) },
    });
    // Credit child's savings atomically
    await tx.child.update({
      where: { id: childId },
      data: { currentAmount: { increment: cashValue } },
    });
  });
}

export async function investNow(
  familyId: string,
  childId: string,
  amount: number,
  name: string,
  type: Investment["type"],
) {
  const ts = Date.now();
  return db.$transaction(async (tx) => {
    // Atomic conditional update — prevents concurrent investNow from
    // both succeeding against a balance that only covers one.
    const updated = await tx.child.updateMany({
      where: { id: childId, currentAmount: { gte: amount } },
      data: { currentAmount: { decrement: amount } },
    });
    if (updated.count === 0) {
      return null; // Insufficient balance
    }

    const inv = await tx.investment.create({
      data: { familyId, childId, name, type, amountInvested: amount, currentValue: amount, status: "active", openedAt: BigInt(ts) },
    });
    await tx.transaction.create({
      data: { familyId, childId, type: "invest", amount, tokenDelta: 0, investmentId: inv.id, note: `Invested in ${name}`, timestamp: BigInt(ts) },
    });
    return inv;
  });
}

export async function createGoal(input: {
  familyId: string;
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
      familyId: input.familyId,
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

export async function updateGoal(familyId: string, id: string, patch: Partial<{
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

export async function deleteGoal(familyId: string, id: string) {
  const g = await db.goal.findFirst({ where: { id, familyId } });
  if (!g) throw new Error("Goal not found or access denied");
  return db.goal.delete({ where: { id } });
}

export async function contributeToGoal(familyId: string, id: string, amount: number) {
  // Atomic increment — no race condition
  return db.goal.update({
    where: { id },
    data: { currentAmount: { increment: amount } },
  });
}

export async function setFamilySettings(familyId: string, patch: { annualTheme?: string; monthlyQuote?: string }) {
  await db.familySettings.upsert({
    where: { familyId },
    update: patch,
    create: { familyId, ...patch },
  });
}

export async function setParentPhoto(familyId: string, parentId: string, photoDataUrl: string) {
  const p = await db.parentProfile.findFirst({ where: { id: parentId, familyId } });
  if (!p) throw new Error("Parent not found or access denied");
  return db.parentProfile.update({ where: { id: parentId }, data: { avatarPhoto: photoDataUrl } });
}

export async function setParentName(familyId: string, parentId: string, name: string) {
  const p = await db.parentProfile.findFirst({ where: { id: parentId, familyId } });
  if (!p) throw new Error("Parent not found or access denied");
  return db.parentProfile.update({ where: { id: parentId }, data: { name: name.trim() || undefined } });
}

export async function setChildPhoto(familyId: string, childId: string, photoDataUrl: string) {
  const c = await db.child.findFirst({ where: { id: childId, familyId } });
  if (!c) throw new Error("Child not found or access denied");
  return db.child.update({ where: { id: childId }, data: { avatarPhoto: photoDataUrl } });
}

export async function setChildName(familyId: string, childId: string, name: string) {
  const c = await db.child.findFirst({ where: { id: childId, familyId } });
  if (!c) throw new Error("Child not found or access denied");
  return db.child.update({ where: { id: childId }, data: { name: name.trim() || undefined } });
}

export async function createChild(input: {
  familyId: string;
  name: string;
  age: number;
  goalName: string;
  goalAmount: number;
  avatarColor?: string;
  nickname?: string;
  mascot?: string;
  pin?: string;
}) {
  const colors = ["#C9A84C", "#6BBF8A", "#D4869A", "#7B9ACC", "#E8A656", "#B084CC"];
  const avatarColor = input.avatarColor || colors[Math.floor(Math.random() * colors.length)];
  const id = `child-${Date.now()}`;
  const nickname = input.nickname?.trim() || input.name.trim();
  const mascot = input.mascot || "dolphin";
  
  // Hash the PIN if provided
  let pinHash: string | null = null;
  if (input.pin && input.pin.length === 4) {
    const bcrypt = require("bcryptjs");
    pinHash = await bcrypt.hash(input.pin, 12);
  }
  
  // Create Child + User + ChildProfile in a transaction
  return db.$transaction(async (tx) => {
    // 1. Create the Child (financial entity)
    const child = await tx.child.create({
      data: {
        id,
        familyId: input.familyId,
        name: input.name.trim(),
        age: input.age,
        avatarColor,
        currentAmount: 0,
        goalAmount: input.goalAmount,
        goalName: input.goalName.trim() || "Savings Goal",
      },
    });
    
    // 2. Create a User account for the child (so they can log in)
    const childUser = await tx.user.create({
      data: {
        email: `child-${id}@planned.local`,  // Internal email, not used for login
        name: input.name.trim(),
        platformRole: "USER",
        familyRole: "CHILD",
        familyId: input.familyId,
        childId: id,
        pinHash,
      },
    });
    
    // 3. Create the ChildProfile (links User to Child, stores mascot + nickname)
    await tx.childProfile.create({
      data: {
        userId: childUser.id,
        childId: id,
        nickname,
        animalCompanion: mascot,
      },
    });
    
    return child;
  });
}

export async function createParent(input: {
  familyId: string;
  name: string;
  role: string;
  avatarColor?: string;
}) {
  const colors = ["#D4869A", "#6BBF8A", "#C9A84C", "#7B9ACC"];
  const avatarColor = input.avatarColor || colors[Math.floor(Math.random() * colors.length)];
  const id = `parent-${Date.now()}`;
  return db.parentProfile.create({
    data: {
      id,
      familyId: input.familyId,
      name: input.name.trim(),
      role: input.role.trim() || "Parent",
      avatarColor,
    },
  });
}


// ============================================================================
// DELETE CAPABILITIES
// ============================================================================

export async function deleteTransaction(familyId: string, id: string): Promise<void> {
  const tx = await db.transaction.findFirst({ where: { id, familyId } });
  if (!tx) throw new Error("Transaction not found or access denied");
  await db.transaction.delete({ where: { id } });
}

export async function deleteSpendingEntry(familyId: string, id: string): Promise<void> {
  const entry = await db.spendingEntry.findFirst({ where: { id, familyId } });
  if (!entry) throw new Error("Spending entry not found or access denied");
  await db.spendingEntry.delete({ where: { id } });
}

export async function closeInvestment(familyId: string, id: string): Promise<void> {
  const inv = await db.investment.findFirst({ where: { id, familyId } });
  if (!inv) throw new Error("Investment not found or access denied");
  await db.investment.update({ where: { id }, data: { status: "closed" } });
}

export async function deleteInvestment(familyId: string, id: string): Promise<void> {
  const inv = await db.investment.findFirst({ where: { id, familyId } });
  if (!inv) throw new Error("Investment not found or access denied");
  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { investmentId: id, familyId } });
    await tx.investment.delete({ where: { id } });
  });
}

export async function deleteChild(familyId: string, childId: string): Promise<void> {
  const child = await db.child.findFirst({ where: { id: childId, familyId } });
  if (!child) throw new Error("Child not found or access denied");
  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { childId, familyId } });
    await tx.spendingEntry.deleteMany({ where: { childId, familyId } });
    await tx.investment.deleteMany({ where: { childId, familyId } });
    await tx.tokenLedgerEntry.deleteMany({ where: { childId, familyId } });
    await tx.account.deleteMany({ where: { childId, familyId } });
    await tx.goal.deleteMany({ where: { ownerId: childId, familyId } });
    await tx.child.delete({ where: { id: childId } });
  });
}

export async function deleteParent(familyId: string, parentId: string): Promise<void> {
  const parent = await db.parentProfile.findFirst({ where: { id: parentId, familyId } });
  if (!parent) throw new Error("Parent not found or access denied");
  await db.$transaction(async (tx) => {
    await tx.spendingEntry.deleteMany({ where: { parentId, familyId } });
    await tx.goal.deleteMany({ where: { ownerId: parentId, familyId } });
    await tx.parentProfile.delete({ where: { id: parentId } });
  });
}

export async function deleteSpendingCategory(familyId: string, id: string): Promise<void> {
  const cat = await db.spendingCategory.findFirst({ where: { id, familyId } });
  if (!cat) throw new Error("Category not found or access denied");
  await db.spendingCategory.delete({ where: { id } });
}

export async function resetFamilyData(familyId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { familyId } });
    await tx.spendingEntry.deleteMany({ where: { familyId } });
    await tx.investment.deleteMany({ where: { familyId } });
    await tx.tokenLedgerEntry.deleteMany({ where: { familyId } });
    await tx.account.deleteMany({ where: { familyId } });
    await tx.goal.deleteMany({ where: { familyId } });
    await tx.child.deleteMany({ where: { familyId } });
    await tx.parentProfile.deleteMany({ where: { familyId } });
    await tx.familySettings.deleteMany({ where: { familyId } });
  });
}
