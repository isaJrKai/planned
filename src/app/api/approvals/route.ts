import { z } from "zod";
import { db } from "@/db";
import { approvalRequests } from "@/db/schema";
import { handler, ok, parseBody, errors, rateLimit } from "@/lib/api";
import { requireViewer } from "@/lib/auth";
import { listPendingApprovals } from "@/lib/family";
import { audit } from "@/lib/audit";

export const GET = handler(async () => {
  const v = await requireViewer();
  const rows = await listPendingApprovals(v.family.id);
  return ok(v.member.role === "child" ? rows.filter((r) => r.memberId === v.member.id) : rows);
});

export const POST = handler(async (req) => {
  const v = await requireViewer();
  if (v.member.role !== "child") throw errors.forbidden("Requests are made by children.");
  rateLimit(`request:${v.member.id}`, 10, 60 * 60 * 1000);
  const { amount, reason } = await parseBody(req, z.object({ amount: z.number().int().positive(), reason: z.string().trim().min(2, "Say what it's for.").max(160) }));
  const [r] = await db.insert(approvalRequests).values({ familyId: v.family.id, memberId: v.member.id, type: "money_request", amount, reason }).returning();
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "request.created", targetType: "request", targetId: r.id, details: { amount, reason } }, req);
  return ok(r, { status: 201 });
});
