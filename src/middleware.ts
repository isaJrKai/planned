// ============================================================================
// MIDDLEWARE — DENY-BY-DEFAULT for /api/*
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookieHeader } from "@/lib/auth-edge";

const PUBLIC_API_ROUTES = new Set([
  "/api/auth/setup",
  "/api/auth/setup-2fa-secret",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/child-login",
  "/api/auth/verify-2fa",
  "/api/auth/logout",
  "/api/auth/me",
]);

const FOUNDER_API_PREFIXES = ["/api/admin", "/api/system", "/api/feature-flags"];
const FOUNDER_BROWSER_PREFIXES = ["/admin", "/system", "/analytics", "/feature-flags", "/security"];
const AUTH_REQUIRED_BROWSER_PREFIXES = ["/admin", "/system", "/analytics", "/feature-flags", "/security"];

function isApiPath(pathname: string): boolean { return pathname.startsWith("/api/"); }
function isPublicApiRoute(pathname: string): boolean { return PUBLIC_API_ROUTES.has(pathname); }
function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isApiPath(pathname)) {
    if (isPublicApiRoute(pathname)) {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      return response;
    }

    const cookieHeader = req.headers.get("cookie");
    const session = await getSessionFromCookieHeader(cookieHeader);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    if (!session) {
      console.warn(JSON.stringify({ type: "auth.denied", reason: "no_session", path: pathname, ip, ua, ts: new Date().toISOString() }));
      return applySecurityHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }));
    }

    if (matchesPrefix(pathname, FOUNDER_API_PREFIXES) && session.platformRole !== "FOUNDER") {
      return applySecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  }

  if (matchesPrefix(pathname, AUTH_REQUIRED_BROWSER_PREFIXES)) {
    const cookieHeader = req.headers.get("cookie");
    const session = await getSessionFromCookieHeader(cookieHeader);

    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (matchesPrefix(pathname, FOUNDER_BROWSER_PREFIXES) && session.platformRole !== "FOUNDER") {
      return applySecurityHeaders(new NextResponse(renderForbiddenHtml(), { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }));
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return response;
  }

  // Route CHILD users to /child
  const childCookieHeader = req.headers.get("cookie");
  const childSession = await getSessionFromCookieHeader(childCookieHeader);

  if (childSession && childSession.familyRole === "CHILD" && !pathname.startsWith("/child") && !pathname.startsWith("/api/") && !pathname.startsWith("/_next") && pathname !== "/manifest.webmanifest" && pathname !== "/favicon.ico") {
    const childUrl = req.nextUrl.clone();
    childUrl.pathname = "/child";
    return applySecurityHeaders(NextResponse.redirect(childUrl));
  }

  if (pathname.startsWith("/child") && childSession && childSession.familyRole !== "CHILD") {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    return applySecurityHeaders(NextResponse.redirect(homeUrl));
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return applySecurityHeaders(response);
}

// Content Security Policy — prevents XSS by restricting what the browser will
// execute. See https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
//
// - default-src 'self': only load resources from same origin
// - script-src 'self' 'unsafe-inline': Next.js hydration needs inline scripts
// - style-src 'self' 'unsafe-inline': Next.js + styled-jsx use inline styles
// - img-src 'self' data: blob: allow data: URIs (avatars) and blob: (uploads)
// - font-src 'self' data: next/font serves from self
// - connect-src 'self': API calls only to same origin (no external fetch)
// - frame-ancestors 'none': prevent clickjacking (no iframes)
// - base-uri 'self': prevent <base> tag injection
// - form-action 'self': prevent form submission to external sites
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP_HEADER);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

function renderForbiddenHtml(): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>403</title><style>body{background:#090C0A;color:#E8E4D8;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}.c{text-align:center}.h{font-size:3rem;color:#C9A84C}.a{color:#C9A84C;text-decoration:none;border:1px solid rgba(201,168,76,0.3);padding:0.5rem 1rem;border-radius:0.375rem;display:inline-block;margin-top:1rem}</style></head><body><div class="c"><div class="h">403</div><p>Access denied.</p><a href="/" class="a">Return to dashboard</a></div></body></html>`;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|apple-touch-icon|robots.txt|sitemap.xml).*)"],
};
