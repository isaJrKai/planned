import { z } from "zod";
import { db } from "@/db";
import { accounts, goals } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireViewer, requireFamilyMember, assertCanActOn } from "@/lib/auth";
import { listGoals } from "@/lib/family";
import { audit } from "@/lib/audit";
import { evaluateAchievements } from "@/lib/achievements";

export const GET = handler(async () => {
  const v = await requireViewer();
  return ok(await listGoals(v.family.id, v.member.role === "child" ? v.member.id : undefined));
});

const schema = z.object({
  memberId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, "Give the goal a name.").max(60),
  targetAmount: z.number().int().positive(),
  targetDate: z.string().datetime().nullable().optional(),
  isShared: z.boolean().default(false),
});

export const POST = handler(async (req) => {
  const v = await requireViewer();
  const body = await parseBody(req, schema);
  let memberId: string | null = body.memberId ?? v.member.id;
  if (body.isShared) {
    if (v.member.role !== "parent") throw errors.forbidden("Only parents can create shared family goals.");
    memberId = null;
  } else {
    assertCanActOn(v, memberId!);
    await requireFamilyMember(v, memberId!);
  }
  const goal = await db.transaction(async (tx) => {
    const [acct] = await tx.insert(accounts).values({ familyId: v.family.id, memberId, kind: "goal", name: `Goal: ${body.name}`, currency: v.family.currency }).returning();
    const [g] = await tx.insert(goals).values({ familyId: v.family.id, memberId, accountId: acct.id, name: body.name, targetAmount: body.targetAmount, targetDate: body.targetDate ? new Date(body.targetDate) : null, isShared: body.isShared }).returning();
    await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "goal.created", targetType: "goal", targetId: g.id, details: { name: g.name, target: g.targetAmount, shared: g.isShared } }, req, tx);
    return g;
  });
  if (memberId) await evaluateAchievements(memberId);
  return ok(goal, { status: 201 });
});
