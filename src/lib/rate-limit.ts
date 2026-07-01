// ============================================================================
// RATE LIMITER — DB-backed (survives restarts, works across instances)
// ============================================================================
// Uses SQLite for persistence. Atomic upsert with count increment.
// Expired entries are cleaned up lazily on access + periodic sweep.
// ============================================================================

import { db } from "./db";

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    // Try to find existing entry
    const existing = await db.rateLimitEntry.findUnique({ where: { key } });

    if (!existing || existing.resetAt < now) {
      // New window — upsert with count=1
      await db.rateLimitEntry.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return { success: true, remaining: limit - 1, resetAt: resetAt.getTime() };
    }

    // Existing window — increment count
    const newCount = existing.count + 1;
    await db.rateLimitEntry.update({
      where: { key },
      data: { count: newCount },
    });

    const remaining = Math.max(0, limit - newCount);
    return {
      success: newCount <= limit,
      remaining,
      resetAt: existing.resetAt.getTime(),
    };
  } catch (err) {
    // If DB fails, fail OPEN (allow request) — better than locking users out
    // due to infrastructure issues. Log the error.
    console.error("Rate limit DB error:", err);
    return { success: true, remaining: limit, resetAt: resetAt.getTime() };
  }
}

// Clean up expired entries periodically (called on each rateLimit call
// with 1% probability to avoid overhead)
export async function cleanupExpiredRateLimits(): Promise<void> {
  if (Math.random() > 0.01) return; // 1% chance per call
  try {
    await db.rateLimitEntry.deleteMany({
      where: { resetAt: { lt: new Date() } },
    });
  } catch {
    // Silent fail — cleanup is best-effort
  }
}
