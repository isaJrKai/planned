import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  if (user.familyRole !== "CHILD") return NextResponse.json({ ok: false, error: "Not a child account" }, { status: 403 });
  const childProfile = await db.childProfile.findFirst({ where: { userId: user.id } });
  if (!childProfile) return NextResponse.json({ ok: false, error: "Child profile not found" }, { status: 404 });
  const child = await db.child.findUnique({ where: { id: childProfile.childId } });
  if (!child) return NextResponse.json({ ok: false, error: "Child record not found" }, { status: 404 });
  const tokenLedger = await db.tokenLedgerEntry.findMany({ where: { childId: child.id }, orderBy: { timestamp: "desc" }, take: 20 });
  const goals = await db.goal.findMany({ where: { ownerId: child.id }, orderBy: { createdAt: "desc" } });
  const tokensGiven = tokenLedger.filter(t => t.type === "parent_give").reduce((s, t) => s + t.tokens, 0);
  const tokensRedeemed = tokenLedger.filter(t => t.type === "redeem").reduce((s, t) => s + t.tokens, 0);
  return NextResponse.json({
    ok: true,
    child: { name: child.name, nickname: childProfile.nickname, age: child.age, avatarColor: child.avatarColor, currentAmount: child.currentAmount, goalAmount: child.goalAmount, goalName: child.goalName },
    profile: { animalCompanion: childProfile.animalCompanion, theme: childProfile.theme, favoriteColor: childProfile.favoriteColor, dashboardMode: childProfile.dashboardMode },
    tokens: { balance: tokensGiven - tokensRedeemed, history: tokenLedger.map(t => ({ type: t.type, tokens: t.tokens, note: t.note, timestamp: Number(t.timestamp) })) },
    goals: goals.map(g => ({ id: g.id, title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0 })),
    lessons: [],
    achievements: [],
  });
}
