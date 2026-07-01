"use client";

// ============================================================================
// RECOMMENDATIONS PANEL — smart, educational suggestions
// ============================================================================

import { useEffect, useState } from "react";
import {
  Lightbulb,
  TrendingUp,
  Wallet,
  Target,
  BookOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface Recommendation {
  type: "savings" | "spending" | "goals" | "education" | "investment" | "general";
  priority: number;
  title: string;
  body: string;
  actionLabel?: string;
  actionTarget?: string;
}

const TYPE_ICONS: Record<string, any> = {
  savings: TrendingUp,
  spending: Wallet,
  goals: Target,
  education: BookOpen,
  investment: TrendingUp,
  tokens: Sparkles,
  general: Lightbulb,
};

export function RecommendationsPanel({
  childId,
  familyId,
  variant = "child",
}: {
  childId?: string;
  familyId?: string;
  variant?: "parent" | "child";
}) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (childId) params.set("childId", childId);
    if (familyId) params.set("familyId", familyId);
    fetch(`/api/recommendations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRecs(data.recommendations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [childId, familyId]);

  if (loading) return null;

  if (recs.length === 0) return null;

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <div className="micro-label-gold">Smart Suggestions</div>
      </div>
      <div className="divider-gold mb-4" />
      <div className="space-y-3">
        {recs.map((rec, i) => {
          const Icon = TYPE_ICONS[rec.type] ?? Lightbulb;
          return (
            <div
              key={i}
              className="flex items-start gap-3 surface-flat rounded-lg p-4"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                  border: "1px solid var(--hairline)",
                }}
              >
                <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground tracking-wide leading-snug mb-1">
                  {rec.title}
                </div>
                <div className="text-xs text-foreground/55 leading-relaxed">
                  {rec.body}
                </div>
                {rec.actionLabel && (
                  <button
                    className="mt-2 text-[10px] tracking-wider uppercase flex items-center gap-1"
                    style={{ color: "var(--primary)" }}
                  >
                    {rec.actionLabel} <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
