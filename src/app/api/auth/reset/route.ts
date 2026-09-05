import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { handler, ok, parseBody, rateLimit, clientIp, errors } from "@/lib/api";
import { hashPassword, sha256 } from "@/lib/crypto";
import { revokeAllSessions } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const POST = handler(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60 * 1000);
  const { token, password } = await parseBody(req, z.object({ token: z.string().min(10), password: z.string().min(10, "Use at least 10 characters.").max(200) }));
  const [row] = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, sha256(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date()))).limit(1);
  if (!row) throw errors.badRequest("That reset link is invalid or has expired. Request a new one.");
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash: hashPassword(password), failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, row.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
  });
  await revokeAllSessions(row.userId);
  await audit({ actorUserId: row.userId, action: "auth.password_reset" }, req);
  return ok({ message: "Your password has been updated. Sign in with your new password." });
});
