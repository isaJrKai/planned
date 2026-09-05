import { and, eq, isNull, gt, desc } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { handler, ok } from "@/lib/api";
import { requireViewer, revokeAllSessions } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const GET = handler(async () => {
  const v = await requireViewer();
  const rows = await db.select({ id: sessions.id, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, ip: sessions.ip, userAgent: sessions.userAgent }).from(sessions)
    .where(and(eq(sessions.userId, v.user.id), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).orderBy(desc(sessions.lastSeenAt));
  return ok(rows.map((r) => ({ ...r, current: r.id === v.sessionId })));
});

export const DELETE = handler(async (req) => {
  const v = await requireViewer();
  await revokeAllSessions(v.user.id, v.sessionId);
  await audit({ familyId: v.family.id, actorUserId: v.user.id, action: "auth.sessions_revoked" }, req);
  return ok({ message: "Signed out everywhere else." });
});
