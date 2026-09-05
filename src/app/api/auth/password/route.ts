import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handler, ok, parseBody, errors } from "@/lib/api";
import { requireViewer, revokeAllSessions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export const PATCH = handler(async (req) => {
  const v = await requireViewer();
  const { current, next } = await parseBody(req, z.object({ current: z.string().min(1), next: z.string().min(10, "Use at least 10 characters.").max(200) }));
  if (!verifyPassword(current, v.user.passwordHash)) throw errors.badRequest("Your current password isn't right.");
  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, v.user.id));
  await revokeAllSessions(v.user.id, v.sessionId);
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "auth.password_changed" }, req);
  return ok({ message: "Password updated. Other devices have been signed out." });
});
