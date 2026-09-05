import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, familyMembers } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireParent, requireFamilyMember, revokeAllSessions } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler<Ctx>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const m = await requireFamilyMember(v, id);
  const body = await parseBody(req, z.object({ password: z.string().min(6).max(100).optional(), name: z.string().trim().min(1).max(40).optional() }));
  if (body.password) {
    await db.update(users).set({ passwordHash: hashPassword(body.password), failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, m.userId));
    await revokeAllSessions(m.userId);
    await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "member.password_reset", targetType: "member", targetId: m.id }, req);
  }
  if (body.name) {
    await db.update(users).set({ displayName: body.name }).where(eq(users.id, m.userId));
    await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "member.renamed", targetType: "member", targetId: m.id, details: { name: body.name } }, req);
  }
  return ok({ updated: true });
});

export const DELETE = handler<Ctx>(async (req, { params }) => {
  const v = await requireParent();
  const { id } = await params;
  const m = await requireFamilyMember(v, id);
  if (m.role === "parent") throw errors.forbidden("Parents can't be removed here. Delete the family from Settings instead.");
  await db.update(familyMembers).set({ deletedAt: new Date() }).where(eq(familyMembers.id, m.id));
  await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, m.userId));
  await revokeAllSessions(m.userId);
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "member.removed", targetType: "member", targetId: m.id }, req);
  return ok({ removed: true });
});
