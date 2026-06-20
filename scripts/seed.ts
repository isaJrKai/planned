// ============================================================================
// SEED SCRIPT — populates the SQLite database with demo data
// ============================================================================
// Run via: bun run scripts/seed.ts
// Mirrors the SEED_* constants from the old Zustand store so the demo data
// is identical to what the app showed before backend wiring.
// ============================================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const NOW = Date.now();
const DAY = 86_400_000;

// ---- Helpers ---------------------------------------------------------------

function startOfPeriod(cadence: "weekly" | "monthly" | "annual"): bigint {
  const d = new Date();
  if (cadence === "weekly") {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return BigInt(d.getTime());
  }
  if (cadence === "monthly") {
    return BigInt(new Date(d.getFullYear(), d.getMonth(), 1).getTime());
  }
  return BigInt(new Date(d.getFullYear(), 0, 1).getTime());
}

async function main() {
  console.log("Seeding database...");

  // ---- Family settings -----------------------------------------------------
  await db.familySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      annualTheme: "2026 — The Year of Disciplined Wealth",
      monthlyQuote: "A shilling saved is a step toward the future you are building.",
    },
  });
  console.log("  ✓ FamilySettings");

  // ---- Parents -------------------------------------------------------------
  await db.parentProfile.create({
    data: { id: "parent-mum", name: "Mama", role: "Mother", avatarColor: "#D4869A" },
  });
  await db.parentProfile.create({
    data: { id: "parent-dad", name: "Papa", role: "Father", avatarColor: "#6BBF8A" },
  });
  console.log("  ✓ Parents (2)");

  // ---- Children ------------------------------------------------------------
  const children = [
    { id: "zara", name: "Zara Namutebi", age: 12, avatarColor: "#C9A84C", currentAmount: 312_500, goalAmount: 500_000, goalName: "Secondary School Tablet" },
    { id: "enoch", name: "Enoch Okello", age: 9, avatarColor: "#6BBF8A", currentAmount: 87_200, goalAmount: 200_000, goalName: "Bicycle" },
    { id: "amani", name: "Amani Atuhaire", age: 7, avatarColor: "#D4943A", currentAmount: 41_800, goalAmount: 100_000, goalName: "Art Supplies Kit" },
  ];
  for (const c of children) {
    await db.child.create({ data: c });
  }
  console.log(`  ✓ Children (${children.length})`);

  // ---- Accounts ------------------------------------------------------------
  const accounts = [
    { id: "acc-zara", childId: "zara", name: "Stanbic Junior — Zara", balance: 62_000 },
    { id: "acc-enoch", childId: "enoch", name: "Centenary Youth — Enoch", balance: 28_500 },
    { id: "acc-amani", childId: "amani", name: "DFCU Pocket — Amani", balance: 15_000 },
  ];
  for (const a of accounts) {
    await db.account.create({ data: a });
  }
  console.log(`  ✓ Accounts (${accounts.length})`);

  // ---- Spending categories -------------------------------------------------
  const categories = [
    { id: "cat-snacks", name: "Snacks & Sweets", budget: 20_000 },
    { id: "cat-airtime", name: "Airtime & Data", budget: 15_000 },
    { id: "cat-school", name: "School Supplies", budget: 30_000 },
    { id: "cat-toys", name: "Toys & Games", budget: 25_000 },
    { id: "cat-gifts", name: "Gifts & Giving", budget: 10_000 },
    { id: "cat-transport", name: "Transport", budget: 12_000 },
  ];
  for (const c of categories) {
    await db.spendingCategory.create({ data: c });
  }
  console.log(`  ✓ SpendingCategories (${categories.length})`);

  // ---- Spending entries ----------------------------------------------------
  const spendBase: { ownerId: string; ownerKind: "parent" | "child"; ownerName: string; cat: string; amt: number; note: string; d: number }[] = [
    { ownerId: "zara", ownerKind: "child", ownerName: "Zara", cat: "Snacks & Sweets", amt: 3_500, note: "Chapati & juice", d: 2 },
    { ownerId: "zara", ownerKind: "child", ownerName: "Zara", cat: "Airtime & Data", amt: 5_000, note: "WhatsApp bundle", d: 5 },
    { ownerId: "zara", ownerKind: "child", ownerName: "Zara", cat: "School Supplies", amt: 8_000, note: "Geometry set", d: 9 },
    { ownerId: "zara", ownerKind: "child", ownerName: "Zara", cat: "Gifts & Giving", amt: 4_000, note: "Friend birthday", d: 12 },
    { ownerId: "enoch", ownerKind: "child", ownerName: "Enoch", cat: "Snacks & Sweets", amt: 2_000, note: "Ice cream", d: 1 },
    { ownerId: "enoch", ownerKind: "child", ownerName: "Enoch", cat: "Toys & Games", amt: 12_000, note: "Marbles set", d: 6 },
    { ownerId: "enoch", ownerKind: "child", ownerName: "Enoch", cat: "Transport", amt: 3_000, note: "Boda to mosque", d: 8 },
    { ownerId: "amani", ownerKind: "child", ownerName: "Amani", cat: "Snacks & Sweets", amt: 1_500, note: "Bubblegum", d: 3 },
    { ownerId: "amani", ownerKind: "child", ownerName: "Amani", cat: "School Supplies", amt: 6_000, note: "Crayons", d: 7 },
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", cat: "Snacks & Sweets", amt: 8_000, note: "Coffee with friend", d: 1 },
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", cat: "Transport", amt: 10_000, note: "Boda to market", d: 3 },
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", cat: "Gifts & Giving", amt: 25_000, note: "Sister's birthday gift", d: 6 },
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", cat: "Airtime & Data", amt: 15_000, note: "Monthly data bundle", d: 10 },
    { ownerId: "parent-dad", ownerKind: "parent", ownerName: "Papa", cat: "Transport", amt: 18_000, note: "Fuel — week", d: 2 },
    { ownerId: "parent-dad", ownerKind: "parent", ownerName: "Papa", cat: "Snacks & Sweets", amt: 5_000, note: "Office tea round", d: 4 },
    { ownerId: "parent-dad", ownerKind: "parent", ownerName: "Papa", cat: "School Supplies", amt: 12_000, note: "Textbooks for Zara", d: 8 },
  ];
  for (const e of spendBase) {
    await db.spendingEntry.create({
      data: {
        ownerId: e.ownerId,
        ownerKind: e.ownerKind,
        ownerName: e.ownerName,
        category: e.cat,
        amount: e.amt,
        note: e.note,
        timestamp: BigInt(NOW - e.d * DAY),
        childId: e.ownerKind === "child" ? e.ownerId : null,
        parentId: e.ownerKind === "parent" ? e.ownerId : null,
      },
    });
  }
  console.log(`  ✓ SpendingEntries (${spendBase.length})`);

  // ---- Investments ---------------------------------------------------------
  const investments = [
    { id: "inv-zara-1", childId: "zara", name: "Stanbic Unit Trust — Balanced", type: "Unit Trust", amountInvested: 100_000, currentValue: 118_400, status: "active", openedAt: BigInt(NOW - 120 * DAY) },
    { id: "inv-zara-2", childId: "zara", name: "Government Treasury Bill — 91d", type: "Treasury Bill", amountInvested: 50_000, currentValue: 51_850, status: "active", openedAt: BigInt(NOW - 45 * DAY) },
    { id: "inv-enoch-1", childId: "enoch", name: "Savings Bond — 1yr", type: "Savings Bond", amountInvested: 30_000, currentValue: 31_200, status: "active", openedAt: BigInt(NOW - 60 * DAY) },
  ];
  for (const inv of investments) {
    await db.investment.create({ data: inv });
  }
  console.log(`  ✓ Investments (${investments.length})`);

  // ---- Token ledger --------------------------------------------------------
  const tokenLedger = [
    { id: "tok-1", childId: "zara", type: "parent_give", tokens: 80, note: "Math test A", timestamp: BigInt(NOW - 30 * DAY) },
    { id: "tok-2", childId: "zara", type: "parent_give", tokens: 50, note: "Chores week", timestamp: BigInt(NOW - 22 * DAY) },
    { id: "tok-3", childId: "zara", type: "redeem", tokens: 40, note: "Redeemed to savings", timestamp: BigInt(NOW - 14 * DAY) },
    { id: "tok-4", childId: "enoch", type: "parent_give", tokens: 60, note: "Reading streak", timestamp: BigInt(NOW - 18 * DAY) },
    { id: "tok-5", childId: "enoch", type: "parent_give", tokens: 30, note: "Helped market", timestamp: BigInt(NOW - 9 * DAY) },
    { id: "tok-6", childId: "amani", type: "parent_give", tokens: 25, note: "Tidied room", timestamp: BigInt(NOW - 7 * DAY) },
  ];
  for (const t of tokenLedger) {
    await db.tokenLedgerEntry.create({ data: t });
  }
  console.log(`  ✓ TokenLedgerEntries (${tokenLedger.length})`);

  // ---- Transactions --------------------------------------------------------
  const transactions = [
    { id: "tx-1", childId: "zara", type: "save", amount: 30_000, tokenDelta: 0, accountId: "acc-zara", note: "First deposit", timestamp: BigInt(NOW - 30 * DAY) },
    { id: "tx-2", childId: "zara", type: "save", amount: 20_000, tokenDelta: 0, accountId: "acc-zara", note: "Birthday gift", timestamp: BigInt(NOW - 20 * DAY) },
    { id: "tx-3", childId: "zara", type: "invest", amount: 100_000, tokenDelta: 0, investmentId: "inv-zara-1", note: "Opened unit trust", timestamp: BigInt(NOW - 120 * DAY) },
    { id: "tx-4", childId: "zara", type: "redeem", amount: 3_200, tokenDelta: 40, note: "40 tokens redeemed @ 80", timestamp: BigInt(NOW - 14 * DAY) },
    { id: "tx-5", childId: "enoch", type: "save", amount: 15_000, tokenDelta: 0, accountId: "acc-enoch", note: "Saved allowance", timestamp: BigInt(NOW - 18 * DAY) },
    { id: "tx-6", childId: "enoch", type: "invest", amount: 30_000, tokenDelta: 0, investmentId: "inv-enoch-1", note: "Savings bond", timestamp: BigInt(NOW - 60 * DAY) },
    { id: "tx-7", childId: "amani", type: "save", amount: 10_000, tokenDelta: 0, accountId: "acc-amani", note: "First savings", timestamp: BigInt(NOW - 7 * DAY) },
    { id: "tx-8", childId: "zara", type: "save", amount: 12_500, tokenDelta: 0, accountId: "acc-zara", note: "Weekly save", timestamp: BigInt(NOW - 3 * DAY) },
    { id: "tx-9", childId: "enoch", type: "save", amount: 4_200, tokenDelta: 0, accountId: "acc-enoch", note: "Saved pocket money", timestamp: BigInt(NOW - 2 * DAY) },
  ];
  for (const t of transactions) {
    await db.transaction.create({ data: t });
  }
  console.log(`  ✓ Transactions (${transactions.length})`);

  // ---- Goals ---------------------------------------------------------------
  const goals = [
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", title: "Emergency Fund", type: "save", cadence: "annual", visibility: "revealed", targetAmount: 5_000_000, currentAmount: 1_850_000, periodStart: startOfPeriod("annual"), note: "Six months of family expenses", parentId: "parent-mum" },
    { ownerId: "parent-dad", ownerKind: "parent", ownerName: "Papa", title: "Family Holiday — December", type: "save", cadence: "annual", visibility: "revealed", targetAmount: 3_500_000, currentAmount: 2_100_000, periodStart: startOfPeriod("annual"), parentId: "parent-dad" },
    { ownerId: "parent-mum", ownerKind: "parent", ownerName: "Mama", title: "Spend Less on Coffee", type: "spend_less", cadence: "monthly", visibility: "private", targetAmount: 80_000, currentAmount: 52_000, periodStart: startOfPeriod("monthly"), note: "Cap at UGX 80k/month", parentId: "parent-mum" },
    { ownerId: "zara", ownerKind: "child", ownerName: "Zara", title: "Secondary School Tablet", type: "save", cadence: "annual", visibility: "revealed", targetAmount: 500_000, currentAmount: 312_500, periodStart: startOfPeriod("annual"), childId: "zara" },
    { ownerId: "enoch", ownerKind: "child", ownerName: "Enoch", title: "Weekly Save UGX 5,000", type: "save", cadence: "weekly", visibility: "revealed", targetAmount: 5_000, currentAmount: 3_200, periodStart: startOfPeriod("weekly"), childId: "enoch" },
  ];
  for (const g of goals) {
    await db.goal.create({ data: g });
  }
  console.log(`  ✓ Goals (${goals.length})`);

  console.log("\n✅ Seed complete.");
  console.log("   Family: 2 parents + 3 children");
  console.log("   Financial: 9 transactions, 16 spending entries, 3 investments, 6 token entries");
  console.log("   Goals: 5 (3 save + 2 spend-less, mix of private/revealed)");
  console.log("   Settings: annual theme + monthly quote");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
