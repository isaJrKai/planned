import { and, eq, gte, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, goals, accounts, approvalRequests, lessonCompletions, allowanceRules } from "@/db/schema";
import { listMembers } from "./family";

export type Pulse = {
  label: "Strong" | "Good" | "Steady" | "Needs attention";
  score: number;
  savedThisMonth: number;
  savedLastMonth: number;
  spentThisMonth: number;
  spentLastMonth: number;
  totalSavings: number;
  activeGoals: number;
  childrenSaving: number;
  childrenTotal: number;
  pending: number;
  notes: string[];
};

const monthStart = (d: Date, offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);

export async function familyPulse(familyId: string): Promise<Pulse> {
  const now = new Date();
  const thisStart = monthStart(now);
  const lastStart = monthStart(now, -1);
  const since = await db.select().from(transactions).where(and(eq(transactions.familyId, familyId), eq(transactions.status, "posted"), gte(transactions.createdAt, lastStart)));
  const acctRows = await db.select().from(accounts).where(eq(accounts.familyId, familyId));
  const savingsIds = new Set(acctRows.filter((a) => a.kind === "savings" || a.kind === "goal").map((a) => a.id));
  const isSaving = (t: typeof since[number]) => !!t.toAccountId && savingsIds.has(t.toAccountId) && !(t.fromAccountId && savingsIds.has(t.fromAccountId));
  const isSpend = (t: typeof since[number]) => t.kind === "spend";
  const sum = (f: (t: typeof since[number]) => boolean, from: Date, to?: Date) =>
    since.filter((t) => f(t) && t.createdAt >= from && (!to || t.createdAt < to)).reduce((s, t) => s + t.amount, 0);
  const savedThisMonth = sum(isSaving, thisStart);
  const savedLastMonth = sum(isSaving, lastStart, thisStart);
  const spentThisMonth = sum(isSpend, thisStart);
  const spentLastMonth = sum(isSpend, lastStart, thisStart);
  const totalSavings = acctRows.filter((a) => savingsIds.has(a.id)).reduce((s, a) => s + a.balance, 0);
  const members = await listMembers(familyId);
  const children = members.filter((m) => m.member.role === "child");
  const childrenSaving = children.filter((c) => since.some((t) => t.memberId === c.member.id && isSaving(t) && t.createdAt >= thisStart)).length;
  const [{ count: activeGoals }] = await db.select({ count: sql<number>`count(*)::int` }).from(goals).where(and(eq(goals.familyId, familyId), eq(goals.status, "active")));
  const [{ count: pending }] = await db.select({ count: sql<number>`count(*)::int` }).from(approvalRequests).where(and(eq(approvalRequests.familyId, familyId), eq(approvalRequests.status, "pending")));

  let score = 50;
  const notes: string[] = [];
  if (savedThisMonth > 0) score += 10;
  if (savedThisMonth > savedLastMonth && savedLastMonth > 0) { score += 15; notes.push(`Savings are up ${Math.round(((savedThisMonth - savedLastMonth) / savedLastMonth) * 100)}% on last month.`); }
  else if (savedLastMonth > 0 && savedThisMonth < savedLastMonth) { score -= 10; notes.push("Savings are behind last month's pace."); }
  if (spentLastMonth > 0 && spentThisMonth > spentLastMonth * 1.25) { score -= 10; notes.push("Spending has picked up noticeably this month."); }
  if (children.length && childrenSaving === children.length) { score += 10; notes.push("Every child has saved something this month."); }
  else if (children.length && childrenSaving === 0) { score -= 5; notes.push("No child has saved yet this month."); }
  if (pending > 0) notes.push(`${pending} ${pending === 1 ? "request is" : "requests are"} waiting for you.`);
  if (activeGoals > 0) score += 5;
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Strong" : score >= 65 ? "Good" : score >= 45 ? "Steady" : "Needs attention";
  return { label, score, savedThisMonth, savedLastMonth, spentThisMonth, spentLastMonth, totalSavings, activeGoals, childrenSaving, childrenTotal: children.length, pending, notes };
}

export type Happening = { id: string; at: Date; text: string; tone: "green" | "amber" | "blue" | "red" | "purple" | "neutral"; href?: string };

export async function whatsHappening(familyId: string, limit = 8): Promise<Happening[]> {
  const members = await listMembers(familyId);
  const nameOf = (id: string | null) => members.find((m) => m.member.id === id)?.user.displayName ?? "Someone";
  const items: Happening[] = [];
  const recentTx = await db.select().from(transactions).where(eq(transactions.familyId, familyId)).orderBy(desc(transactions.createdAt)).limit(30);
  const completed = await db.select().from(goals).where(and(eq(goals.familyId, familyId), eq(goals.status, "completed"))).orderBy(desc(goals.completedAt)).limit(5);
  for (const g of completed) items.push({ id: `g-${g.id}`, at: g.completedAt ?? g.createdAt, text: `${nameOf(g.memberId)} reached the ${g.name} goal`, tone: "green", href: `/app/goals` });
  const pend = await db.select().from(approvalRequests).where(and(eq(approvalRequests.familyId, familyId), eq(approvalRequests.status, "pending"))).limit(5);
  for (const p of pend) items.push({ id: `p-${p.id}`, at: p.createdAt, text: `${nameOf(p.memberId)} is waiting on a ${p.type === "money_request" ? "money request" : p.type === "goal_withdrawal" ? "goal withdrawal" : "purchase"}`, tone: "amber", href: "/app/approvals" });
  const lessons = await db.select().from(lessonCompletions).orderBy(desc(lessonCompletions.completedAt)).limit(20);
  for (const l of lessons.filter((l) => members.some((m) => m.member.id === l.memberId)).slice(0, 3)) items.push({ id: `l-${l.id}`, at: l.completedAt, text: `${nameOf(l.memberId)} finished a lesson`, tone: "purple", href: "/app/children" });
  for (const t of recentTx.slice(0, 6)) {
    if (t.kind === "goal_contribution") items.push({ id: `t-${t.id}`, at: t.createdAt, text: `${nameOf(t.memberId)} put money toward a goal`, tone: "green", href: "/app/transactions" });
    else if (t.kind === "spend") items.push({ id: `t-${t.id}`, at: t.createdAt, text: `${nameOf(t.memberId)} spent on ${t.category ?? "something"}`, tone: "red", href: "/app/transactions" });
    else if (t.kind === "allowance") items.push({ id: `t-${t.id}`, at: t.createdAt, text: `Allowance paid to ${nameOf(t.memberId)}`, tone: "blue", href: "/app/allowances" });
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export type Suggestion = { title: string; body: string; href: string; cta: string; tone: "blue" | "green" | "amber" };

export async function nextMoves(familyId: string): Promise<Suggestion[]> {
  const out: Suggestion[] = [];
  const members = await listMembers(familyId);
  const children = members.filter((m) => m.member.role === "child");
  const pool = await db.select().from(accounts).where(and(eq(accounts.familyId, familyId), eq(accounts.kind, "family_pool"))).limit(1);
  const rules = await db.select().from(allowanceRules).where(and(eq(allowanceRules.familyId, familyId), eq(allowanceRules.active, true)));
  const weeklyNeed = rules.reduce((s, r) => s + (r.cadence === "weekly" ? r.amount : Math.round(r.amount / 4)), 0);
  const pend = await db.select().from(approvalRequests).where(and(eq(approvalRequests.familyId, familyId), eq(approvalRequests.status, "pending")));
  if (pend.length) out.push({ title: `${pend.length} ${pend.length === 1 ? "request needs" : "requests need"} a decision`, body: "Children are waiting. A quick answer keeps the habit of asking alive.", href: "/app/approvals", cta: "Review", tone: "amber" });
  if (!children.length) out.push({ title: "Add your first child", body: "Each child gets their own spending and savings accounts, and a login of their own.", href: "/app/children", cta: "Add a child", tone: "blue" });
  else if (!rules.length) out.push({ title: "Set up an allowance", body: "A regular, predictable amount teaches more than occasional cash. You choose how much goes to savings automatically.", href: "/app/allowances", cta: "Create allowance", tone: "blue" });
  if (pool[0] && weeklyNeed > 0 && pool[0].balance < weeklyNeed * 2) out.push({ title: "Top up the family pool", body: `Upcoming allowances need about ${weeklyNeed.toLocaleString()} per week. The pool has ${pool[0].balance.toLocaleString()}.`, href: "/app/transactions?action=deposit", cta: "Add funds", tone: "green" });
  const active = await db.select({ goal: goals, acct: accounts }).from(goals).innerJoin(accounts, eq(accounts.id, goals.accountId)).where(and(eq(goals.familyId, familyId), eq(goals.status, "active")));
  for (const { goal, acct } of active) {
    const p = goal.targetAmount ? acct.balance / goal.targetAmount : 0;
    if (p >= 0.8 && p < 1) {
      const name = members.find((m) => m.member.id === goal.memberId)?.user.displayName ?? "Someone";
      out.push({ title: `${name} is ${Math.round(p * 100)}% of the way to ${goal.name}`, body: `A family contribution of ${(goal.targetAmount - acct.balance).toLocaleString()} would finish it. Or let them get there on their own — both teach something.`, href: `/app/goals/${goal.id}`, cta: "See goal", tone: "green" });
      break;
    }
  }
  if (!out.length) out.push({ title: "Nothing needs your attention", body: "Allowances are on schedule and there are no pending requests. A good moment for a money conversation at dinner.", href: "/app/reports", cta: "See this month", tone: "green" });
  return out.slice(0, 3);
}
