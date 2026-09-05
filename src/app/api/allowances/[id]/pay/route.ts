import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { allowanceRules } from "@/db/schema";
import { handler, ok, errors } from "@/lib/api";
import { requireParent } from "@/lib/auth";
import { payAllowance, periodKey } from "@/lib/allowances";
import { audit } from "@/lib/audit";

/** Pay now. Idempotent per rule per period — a double tap cannot pay twice. */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const [rule] = await db.select().from(allowanceRules).where(and(eq(allowanceRules.id, id), eq(allowanceRules.familyId, v.family.id))).limit(1);
  if (!rule) throw errors.notFound("That allowance");
  const period = periodKey(rule, new Date());
  const res = await payAllowance(rule, v.user.id, period, { manual: true });
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "allowance.paid", targetType: "allowance", targetId: id, details: { period, duplicate: res.duplicate } }, req);
  return ok({ ...res, period, message: res.duplicate ? "This period's allowance was already paid — nothing was sent twice." : "Allowance paid." });
});
