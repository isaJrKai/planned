// @ts-nocheck — dead code or missing dependency
// ============================================================================
// ANALYTICS SERVICE — event tracking
// ============================================================================

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const AnalyticsService = {
  async track(input: {
    familyId?: string;
    userId?: string;
    childId?: string;
    event: string;
    properties?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await db.analyticsEvent.create({
        data: {
          familyId: input.familyId,
          userId: input.userId,
          childId: input.childId,
          event: input.event,
          properties: input.properties ? JSON.stringify(input.properties) : null,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (err) {
      // Analytics should never break the app — fail silently
      logger.debug("Analytics track failed", { err, event: input.event });
    }
  },

  async getEventCounts(days: number = 30): Promise<Record<string, number>> {
    const since = new Date(Date.now() - days * 86400000);
    try {
      const events = await db.analyticsEvent.groupBy({
        by: ["event"],
        where: { createdAt: { gte: since } },
        _count: { event: true },
      });
      const result: Record<string, number> = {};
      for (const e of events) result[e.event] = e._count.event;
      return result;
    } catch {
      return {};
    }
  },

  async getDailyActiveUsers(days: number = 30): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    try {
      const result = await db.analyticsEvent.findMany({
        where: { createdAt: { gte: since }, userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true },
      });
      return result.length;
    } catch {
      return 0;
    }
  },
};
