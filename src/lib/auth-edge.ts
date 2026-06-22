// ============================================================================
// EDGE-COMPATIBLE AUTH — used by middleware.ts
// ============================================================================
// This module contains ONLY the JWT verification logic, with no Node.js
// dependencies (no Prisma, no bcrypt, no fs, no otpauth). This allows it
// to run in Vercel's Edge Runtime where middleware executes.
// ============================================================================

import { jwtVerify } from "jose";

export const SESSION_COOKIE = "planned-session";

const INSECURE_DEFAULT = "DEV-ONLY-INSECURE-SECRET-DO-NOT-USE-IN-PRODUCTION-change-me-please";
const JWT_SECRET_STRING = process.env.JWT_SECRET ?? INSECURE_DEFAULT;
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface SessionPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function getSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
): Promise<SessionPayload | null> {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k]) => k)
      .map(([k, ...rest]) => [k, decodeURIComponent(rest.join("="))]),
  );
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, email: payload.email, role: payload.role, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}
