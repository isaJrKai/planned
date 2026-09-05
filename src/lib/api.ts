import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const errors = {
  unauthorized: () => new ApiError(401, "unauthorized", "You need to sign in."),
  forbidden: (m = "You don't have permission to do that.") => new ApiError(403, "forbidden", m),
  notFound: (what = "That") => new ApiError(404, "not_found", `${what} could not be found.`),
  badRequest: (m: string, details?: unknown) => new ApiError(400, "bad_request", m, details),
  conflict: (m: string) => new ApiError(409, "conflict", m),
  tooMany: () => new ApiError(429, "rate_limited", "Too many attempts. Please wait a moment."),
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { ok: false, error: { code: "validation", message: "Some fields need attention.", details: err.flatten().fieldErrors } },
      { status: 400 },
    );
  }
  console.error("[api] unhandled", err);
  return NextResponse.json(
    { ok: false, error: { code: "internal", message: "Something went wrong on our side." } },
    { status: 500 },
  );
}

/** Wrap a route handler: consistent errors, origin check for mutations. */
export function handler<Ctx = unknown>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      return fail(e);
    }
  };
}

/** CSRF defence in depth: SameSite=Lax cookies plus Origin/Host check for mutations. */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser or same-origin fetch without Origin
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw errors.forbidden("Cross-origin request blocked.");
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw errors.forbidden("Cross-origin request blocked.");
  }
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw errors.badRequest("Request body must be JSON.");
  }
  return schema.parse(json);
}

export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

/* ---------- Rate limiting (sliding window, in-process) ---------- */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    throw errors.tooMany();
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t > windowMs)) buckets.delete(k);
  }
}

export function idempotencyKeyFrom(req: NextRequest, fallback?: string) {
  const k = req.headers.get("idempotency-key");
  if (k && k.length >= 8 && k.length <= 128) return k;
  if (fallback) return fallback;
  throw errors.badRequest("An Idempotency-Key header is required for this action.");
}
