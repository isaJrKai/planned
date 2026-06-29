import { jwtVerify } from "jose";
export const SESSION_COOKIE = "planned-session";
const INSECURE_DEFAULT = "DEV-ONLY-INSECURE-SECRET-DO-NOT-USE-IN-PRODUCTION-change-me-please";
const JWT_SECRET_STRING = process.env.JWT_SECRET ?? INSECURE_DEFAULT;
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
export interface SessionPayload { sub: string; email: string; platformRole: string; familyRole: string; sessionId: string; iat?: number; exp?: number; }
// ⚠ EDGE-RUNTIME TRUST MODEL ⚠
// This module runs in middleware (Edge runtime), which CANNOT access Prisma/SQLite.
// It performs JWT-signature verification only — it does NOT verify that the
// session record still exists in the DB. The real session-validity check
// (revoked? expired? deleted?) happens in getAuthUser() on the Node.js side,
// which is called by every page server component and every protected API route.
//
// Middleware's job is the fast-path: reject obviously-bad requests (no cookie,
// tampered JWT, wrong signature) before they reach the application. JWTs that
// pass middleware but belong to a revoked session will be rejected by
// getAuthUser() at the page/route level.
export async function getSessionFromCookieHeader(cookieHeader: string | null | undefined): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => c.trim().split("=")).filter(([k]) => k).map(([k, ...rest]) => [k, decodeURIComponent(rest.join("="))]));
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.platformRole !== "string" || typeof payload.sessionId !== "string") return null;
    return { sub: payload.sub, email: payload.email, platformRole: payload.platformRole as string, familyRole: (payload.familyRole as string) || "PARENT", sessionId: payload.sessionId as string, iat: payload.iat, exp: payload.exp };
  } catch { return null; }
}