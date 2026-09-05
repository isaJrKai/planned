import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { allowanceRules } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const body = await parseBody(req, z.object({ active: z.boolean().optional(), amount: z.number().int().positive().optional(), savePercent: z.number().int().min(0).max(100).optional() }));
  const [rule] = await db.update(allowanceRules).set(body).where(and(eq(allowanceRules.id, id), eq(allowanceRules.familyId, v.family.id))).returning();
  if (!rule) throw errors.notFound("That allowance");
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "allowance.updated", targetType: "allowance", targetId: id, details: body }, req);
  return ok(rule);
});
