import { z } from "zod";
import { db } from "@/db";
import { familyRules } from "@/db/schema";
import { handler, ok, parseBody } from "@/lib/api";
import { requireParent, requireViewer } from "@/lib/auth";
import { getRules } from "@/lib/family";
import { audit } from "@/lib/audit";

export const GET = handler(async () => ok(await getRules((await requireViewer()).family.id)));

export const PATCH = handler(async (req) => {
  const v = await requireParent();
  const body = await parseBody(req, z.object({ minSavePercent: z.number().int().min(0).max(100).optional(), approvalThreshold: z.number().int().min(0).optional(), dailySpendLimit: z.number().int().min(0).optional(), goalWithdrawalNeedsApproval: z.boolean().optional() }));
  const [r] = await db.insert(familyRules).values({ familyId: v.family.id, ...body }).onConflictDoUpdate({ target: familyRules.familyId, set: { ...body, updatedAt: new Date() } }).returning();
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "rules.updated", targetType: "family", targetId: v.family.id, details: body }, req);
  return ok(r);
});
