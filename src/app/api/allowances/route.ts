import { z } from "zod";
import { db } from "@/db";
import { allowanceRules } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireParent, requireViewer, requireFamilyMember } from "@/lib/auth";
import { listAllowanceRules } from "@/lib/family";
import { nextDue } from "@/lib/allowances";
import { audit } from "@/lib/audit";

export const GET = handler(async () => {
  const v = await requireViewer();
  return ok(await listAllowanceRules(v.family.id, v.member.role === "child" ? v.member.id : undefined));
});

const schema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().int().positive(),
  cadence: z.enum(["weekly", "monthly"]),
  dayOfPeriod: z.number().int().min(0).max(28),
  savePercent: z.number().int().min(0).max(100).default(0),
  goalPercent: z.number().int().min(0).max(100).default(0),
  goalId: z.string().uuid().nullable().optional(),
});

export const POST = handler(async (req) => {
  const v = await requireParent();
  const body = await parseBody(req, schema);
  const m = await requireFamilyMember(v, body.memberId);
  if (m.role !== "child") throw errors.badRequest("Allowances are for children.");
  if (body.savePercent + body.goalPercent > 100) throw errors.badRequest("The split adds up to more than 100%.");
  const [rule] = await db.insert(allowanceRules).values({
    familyId: v.family.id, memberId: body.memberId, amount: body.amount, cadence: body.cadence, dayOfPeriod: body.dayOfPeriod,
    savePercent: body.savePercent, goalPercent: body.goalId ? body.goalPercent : 0, goalId: body.goalId ?? null, nextDueAt: nextDue(body.cadence, body.dayOfPeriod),
  }).returning();
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "allowance.created", targetType: "allowance", targetId: rule.id, details: { amount: body.amount, cadence: body.cadence } }, req);
  return ok(rule, { status: 201 });
});
