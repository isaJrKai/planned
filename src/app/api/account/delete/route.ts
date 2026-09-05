import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { families, users, familyMembers } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireParent, destroySession, revokeAllSessions } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { audit } from "@/lib/audit";

/** Deletes the whole family: all members, accounts, ledger, goals, lessons. Audit rows are kept without personal data. */
export const POST = handler(async (req) => {
  const v = await requireParent();
  const { password, confirm } = await parseBody(req, z.object({ password: z.string().min(1), confirm: z.literal("DELETE") }));
  if (!verifyPassword(password, v.user.passwordHash)) throw errors.badRequest("That password isn't right.");
  const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, v.family.id));
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "family.deleted", details: { members: members.length } }, req);
  for (const m of members) await revokeAllSessions(m.userId);
  await db.transaction(async (tx) => {
    await tx.delete(families).where(eq(families.id, v.family.id)); // cascades to members, accounts, ledger, goals
    for (const m of members) await tx.delete(users).where(eq(users.id, m.userId));
  });
  await destroySession();
  return ok({ redirect: "/" });
});
