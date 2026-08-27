// ============================================================================
// API V1 — VERSIONED PUBLIC API
// ============================================================================
// Every capability is exposed as a versioned API endpoint. The web app is
// merely one consumer. Future consumers: mobile apps, schools, partners,
// AI tutors, research platforms, government literacy initiatives.
//
// Versioning strategy: URL-based (/api/v1/, /api/v2/). Old versions maintained
// for at least 12 months after v(N+1) ships. Breaking changes require new
// major version. Additive changes (new fields, new endpoints) are non-breaking.
//
// All responses follow this envelope:
//   { "data": T, "meta": { "version": "v1", "timestamp": "..." } }
// ============================================================================

import { NextResponse } from "next/server";

export function apiResponse(data: any, status: number = 200) {
  return NextResponse.json(
    { data, meta: { version: "v1", timestamp: new Date().toISOString() } },
    { status }
  );
}

export function apiError(message: string, status: number = 400, code?: string) {
  return NextResponse.json(
    { error: { message, code: code ?? "ERROR", status }, meta: { version: "v1", timestamp: new Date().toISOString() } },
    { status }
  );
}
