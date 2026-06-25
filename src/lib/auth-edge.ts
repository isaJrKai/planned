import { jwtVerify } from "jose";
export const SESSION_COOKIE = "planned-session";
// JWT secret — fail fast if missing or insecure. Matches auth.ts.
// Edge runtime (middleware) imports this module, so the throw happens at
// middleware load time — Vercel will mark the deployment as failed if
// JWT_SECRET is unset, rather than silently using a known string.
const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING || JWT_SECRET_STRING.length < 32) {
  throw new Error(
    "JWT_SECRET environment variable is required and must be at least 32 characters."
  );
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
export interface SessionPayload { sub: string; email: string; platformRole: string; familyRole: string; iat?: number; exp?: number; }
export async function getSessionFromCookieHeader(cookieHeader: string | null | undefined): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => c.trim().split("=")).filter(([k]) => k).map(([k, ...rest]) => [k, decodeURIComponent(rest.join("="))]));
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.platformRole !== "string") return null;
    return { sub: payload.sub, email: payload.email, platformRole: payload.platformRole as string, familyRole: (payload.familyRole as string) || "PARENT", iat: payload.iat, exp: payload.exp };
  } catch { return null; }
}
