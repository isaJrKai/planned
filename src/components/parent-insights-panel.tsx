"use client";

// ============================================================================
// PARENT INSIGHTS PANEL — intelligent summaries with explainability
// ============================================================================

import { useEffect, useState } from "react";
import { Brain, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, BookOpen, Users } from "lucide-react";

interface Insight {
  id: string;
  type: "savings" | "spending" | "goals" | "education" | "family";
  priority: number;
  title: string;
  body: string;
  why: string;
  childName?: string;
  actionLabel?: string;
  actionTarget?: string;
  confidence: number;
}

const TYPE_ICONS: Record<string, any> = {
  savings: TrendingUp,
  spending: TrendingDown,
  goals: Target,
  education: BookOpen,
  family: Users,
};

export function ParentInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((data) => {
        setInsights(data.insights ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || insights.length === 0) return null;

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <div className="micro-label-gold">AI Insights</div>
      </div>
      <div className="divider-gold mb-4" />
      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = TYPE_ICONS[insight.type] ?? Brain;
          const isExpanded = expanded === insight.id;
          return (
            <div key={insight.id} className="surface-flat rounded-lg p-4">
              <div className="flex items-start gap-3">
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
                    {insight.title}
                  </div>
                  <div className="text-xs text-foreground/55 leading-relaxed">
                    {insight.body}
                  </div>

                  {/* Explainability toggle */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : insight.id)}
                    className="mt-2 text-[10px] tracking-wider uppercase flex items-center gap-1"
                    style={{ color: "var(--primary)", opacity: 0.7 }}
                  >
                    Why am I seeing this?
                    {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 text-[10px] text-foreground/40 leading-relaxed italic surface-flat p-2 rounded">
                      {insight.why}
                      <div className="mt-1 not-italic">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
