// @ts-nocheck — dead code or missing dependency
// ============================================================================
// FEATURE FLAG SERVICE
// ============================================================================

import { db } from "@/lib/db";

export const FeatureFlagService = {
  async isEnabled(key: string, familyId?: string): Promise<boolean> {
    try {
      const flag = await db.featureFlag.findUnique({ where: { key } });
      if (!flag) return false;

      // Check family-specific override
      if (familyId) {
        const override = await db.featureFlagOverride.findUnique({
          where: { flagId_familyId: { flagId: flag.id, familyId } },
        });
        if (override) return override.enabled;
      }

      return flag.enabled;
    } catch {
      return false;
    }
  },

  async getAll() {
    try {
      return await db.featureFlag.findMany({ orderBy: { key: "asc" } });
    } catch {
      return [];
    }
  },

  async toggle(key: string, enabled: boolean) {
    try {
      return await db.featureFlag.update({
        where: { key },
        data: { enabled },
      });
    } catch {
      return null;
    }
  },

  async seedDefaults() {
    const defaults = [
      { key: "ai_coach", name: "AI Financial Coach", description: "LLM-powered chat assistant for children", enabled: true },
      { key: "education", name: "Financial Literacy Lessons", description: "Interactive lessons with quizzes", enabled: true },
      { key: "achievements", name: "Achievement System", description: "Badges, streaks, and milestones", enabled: true },
      { key: "recommendations", name: "Smart Recommendations", description: "Rule-based educational suggestions", enabled: true },
      { key: "insights", name: "Parent AI Insights", description: "Intelligent summaries with explainability", enabled: true },
      { key: "maturity_score", name: "Financial Maturity Score", description: "Transparent 4-dimension scoring", enabled: true },
      { key: "multi_currency", name: "Multi-Currency Support", description: "UGX, USD, KES, TZS, RWF", enabled: false },
      { key: "family_chat", name: "Family Chat (Beta)", description: "In-app messaging between family members", enabled: false },
      { key: "broker_integration", name: "Broker Integration (Beta)", description: "Real USE stock integration", enabled: false },
      { key: "ai_generated_lessons", name: "AI-Generated Lessons (Beta)", description: "Dynamically generated educational content", enabled: false },
    ];

    for (const f of defaults) {
      try {
        await db.featureFlag.upsert({
          where: { key: f.key },
          update: { name: f.name, description: f.description },
          create: f,
        });
      } catch {}
    }
  },
};
