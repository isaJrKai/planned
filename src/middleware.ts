// ============================================================================
// MIDDLEWARE — DENY-BY-DEFAULT for /api/*
// ============================================================================
// Every /api/* route requires an authenticated session, EXCEPT a small
// allowlist of public endpoints. Admin routes additionally require SUPER_ADMIN.
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookieHeader } from "@/lib/auth-edge";

const PUBLIC_API_ROUTES = new Set([
  "/api/auth/setup",
  "/api/auth/setup-2fa-secret",
  "/api/auth/login",
  "/api/auth/verify-2fa",
  "/api/auth/logout",
  "/api/auth/me",
]);

const SUPER_ADMIN_API_PREFIXES = ["/api/admin", "/api/system", "/api/feature-flags"];
const SUPER_ADMIN_BROWSER_PREFIXES = ["/admin", "/system", "/analytics", "/feature-flags", "/security"];
const AUTH_REQUIRED_BROWSER_PREFIXES = ["/admin", "/system", "/analytics", "/feature-flags", "/security"];

function isApiPath(pathname: string): boolean { return pathname.startsWith("/api/"); }
function isPublicApiRoute(pathname: string): boolean { return PUBLIC_API_ROUTES.has(pathname); }
function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isApiPath(pathname)) {
    if (isPublicApiRoute(pathname)) return NextResponse.next();

    const cookieHeader = req.headers.get("cookie");
    const session = await getSessionFromCookieHeader(cookieHeader);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    if (!session) {
      console.warn(JSON.stringify({ type: "auth.denied", reason: "no_session", path: pathname, ip, ua, ts: new Date().toISOString() }));
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (matchesPrefix(pathname, SUPER_ADMIN_API_PREFIXES) && session.role !== "SUPER_ADMIN") {
      console.warn(JSON.stringify({ type: "auth.denied", reason: "insufficient_role", path: pathname, role: session.role, sub: session.sub, ip, ua, ts: new Date().toISOString() }));
      return NextResponse.json({ error: "Forbidden: founder-only resource" }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (matchesPrefix(pathname, AUTH_REQUIRED_BROWSER_PREFIXES)) {
    const cookieHeader = req.headers.get("cookie");
    const session = await getSessionFromCookieHeader(cookieHeader);

    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (matchesPrefix(pathname, SUPER_ADMIN_BROWSER_PREFIXES) && session.role !== "SUPER_ADMIN") {
      return new NextResponse(renderForbiddenHtml(), { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

function renderForbiddenHtml(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>403 — Planned</title><style>body{background:#090C0A;color:#E8E4D8;font-family:ui-sans-serif,system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:1.5rem}.card{max-width:28rem;text-align:center}.code{font-family:Georgia,serif;font-size:3rem;letter-spacing:0.15em;color:#C9A84C;margin-bottom:1rem}.title{font-size:1.125rem;margin-bottom:0.5rem}.body{font-size:0.875rem;opacity:0.6;line-height:1.6;margin-bottom:1.5rem}.link{color:#C9A84C;text-decoration:none;font-size:0.875rem;border:1px solid rgba(201,168,76,0.3);padding:0.5rem 1rem;border-radius:0.375rem}</style></head><body><div class="card"><div class="code">403</div><div class="title">Founder-only area</div><p class="body">This section of Planned is reserved for the founder. Your account does not have access.</p><a href="/" class="link">Return to dashboard</a></div></body></html>`;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|apple-touch-icon|robots.txt|sitemap.xml).*)"],
};
