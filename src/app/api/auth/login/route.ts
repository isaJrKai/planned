import { z } from "zod";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, familyMembers } from "@/db/schema";
import { handler, ok, parseBody, rateLimit, clientIp, errors } from "@/lib/api";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});

export const POST = handler(async (req) => {
  const ip = clientIp(req);
  rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  const { identifier, password } = await parseBody(req, schema);
  const ident = identifier.toLowerCase();
  rateLimit(`login:${ident}`, 10, 15 * 60 * 1000);

  const [user] = await db
    .select()
    .from(users)
    .where(and(or(eq(users.email, ident), eq(users.username, ident)), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    await audit({ action: "auth.login_failed", details: { identifier: ident, reason: "no_user" } }, req);
    return failLogin();
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await audit({ actorUserId: user.id, action: "auth.login_locked" }, req);
    throw errors.tooMany();
  }

  if (!verifyPassword(password, user.passwordHash)) {
    // Increment in SQL rather than read-modify-write in application memory.
    // Concurrent failed attempts can no longer overwrite one another.
    const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    const [updated] = await db
      .update(users)
      .set({
        failedLoginCount: sql`${users.failedLoginCount} + 1`,
        lockedUntil: sql`CASE WHEN ${users.failedLoginCount} + 1 >= 8 THEN ${lockoutUntil} ELSE NULL END`,
      })
      .where(eq(users.id, user.id))
      .returning({ count: users.failedLoginCount });

    await audit(
      { actorUserId: user.id, action: "auth.login_failed", details: { count: updated?.count ?? null } },
      req,
    );
    return failLogin();
  }

  const [member] = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.userId, user.id), isNull(familyMembers.deletedAt)))
    .limit(1);

  if (!member) return failLogin();

  await db
    .update(users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
  await audit(
    { familyId: member.familyId, actorUserId: user.id, action: "auth.login", targetType: "user", targetId: user.id },
    req,
  );
  return ok({ redirect: member.role === "parent" ? "/app" : "/me", name: user.displayName });
});

function failLogin(): never {
  const e = errors.unauthorized();
  e.message = "We couldn't sign you in with those details.";
  throw e;
}
