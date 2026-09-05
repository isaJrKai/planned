import { cookies } from "next/headers";
import { cache } from "react";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, familyMembers, families, type User, type FamilyMember, type Family } from "@/db/schema";
import { randomToken, sha256 } from "./crypto";
import { errors } from "./api";

export const SESSION_COOKIE = "planned_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type Viewer = {
  user: User;
  member: FamilyMember;
  family: Family;
  sessionId: string;
};

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [row] = await db
    .insert(sessions)
    .values({ userId, tokenHash: sha256(token), expiresAt, ip: meta.ip ?? null, userAgent: meta.userAgent?.slice(0, 300) ?? null })
    .returning({ id: sessions.id });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return row.id;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, sha256(token)));
  }
  jar.delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  const rows = await db.select({ id: sessions.id }).from(sessions).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  for (const r of rows) {
    if (r.id === exceptSessionId) continue;
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, r.id));
  }
}

/** Resolve the current viewer from the session cookie. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = new Date();
  const rows = await db
    .select({ session: sessions, user: users, member: familyMembers, family: families })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .innerJoin(familyMembers, and(eq(familyMembers.userId, users.id), isNull(familyMembers.deletedAt)))
    .innerJoin(families, and(eq(families.id, familyMembers.familyId), isNull(families.deletedAt)))
    .where(and(eq(sessions.tokenHash, sha256(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, now), isNull(users.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // Touch last seen at most once every 5 minutes.
  if (now.getTime() - row.session.lastSeenAt.getTime() > 5 * 60 * 1000) {
    db.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, row.session.id)).catch(() => {});
  }
  return { user: row.user, member: row.member, family: row.family, sessionId: row.session.id };
});

export async function requireViewer(): Promise<Viewer> {
  const v = await getViewer();
  if (!v) throw errors.unauthorized();
  return v;
}

export async function requireParent(): Promise<Viewer> {
  const v = await requireViewer();
  if (v.member.role !== "parent") throw errors.forbidden("Only parents can do that.");
  return v;
}

/** Load a member that must belong to the viewer's family. Never trust client-provided family ids. */
export async function requireFamilyMember(viewer: Viewer, memberId: string) {
  const [m] = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, viewer.family.id), isNull(familyMembers.deletedAt)))
    .limit(1);
  if (!m) throw errors.notFound("That family member");
  return m;
}

/** Children can only act on themselves; parents can act on anyone in the family. */
export function assertCanActOn(viewer: Viewer, memberId: string) {
  if (viewer.member.role === "parent") return;
  if (viewer.member.id !== memberId) throw errors.forbidden();
}

export async function loadUserById(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
}
