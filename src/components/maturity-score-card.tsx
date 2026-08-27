"use client";

// ============================================================================
// FINANCIAL MATURITY SCORE — transparent, explainable scoring
// ============================================================================

import { useEffect, useState } from "react";
import { Brain, TrendingUp, Target, Wallet, BookOpen, Lightbulb } from "lucide-react";
import type { Child } from "@/lib/types";

interface MaturityScore {
  total: number;
  level: string;
  dimensions: {
    savingConsistency: { score: number; label: string; explanation: string };
    goalDiscipline: { score: number; label: string; explanation: string };
    budgetAwareness: { score: number; label: string; explanation: string };
    financialKnowledge: { score: number; label: string; explanation: string };
  };
  suggestions: string[];
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "var(--chart-3)",
  Growing: "var(--primary)",
  Confident: "var(--chart-2)",
  Mentor: "var(--chart-5)",
};

export function MaturityScoreCard({ child }: { child: Child }) {
  const [score, setScore] = useState<MaturityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/maturity?childId=${child.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setScore(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [child.id]);

  if (loading) {
    return (
      <div className="surface-wood rounded-lg p-5">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: 120 }} />
      </div>
    );
  }

  if (!score) return null;

  const levelColor = LEVEL_COLORS[score.level] ?? "var(--primary)";
  const dimensions = [
    { ...score.dimensions.savingConsistency, icon: TrendingUp, maxScore: 25 },
    { ...score.dimensions.goalDiscipline, icon: Target, maxScore: 25 },
    { ...score.dimensions.budgetAwareness, icon: Wallet, maxScore: 25 },
    { ...score.dimensions.financialKnowledge, icon: BookOpen, maxScore: 25 },
  ];

  return (
    <div className="surface-wood-strong rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1 flex items-center gap-1.5">
            <Brain className="h-3 w-3" /> Financial Maturity
          </div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">
            {score.level}
          </h3>
        </div>
        {/* Circular score */}
        <div className="relative">
          <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
            <circle cx="30" cy="30" r="26" fill="none" stroke="var(--hairline)" strokeWidth="4" />
            <circle
              cx="30"
              cy="30"
              r="26"
              fill="none"
              stroke={levelColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 - (score.total / 100) * 2 * Math.PI * 26}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-editorial text-lg tabular-nums" style={{ color: levelColor }}>
              {score.total}
            </span>
          </div>
        </div>
      </div>

      <div className="divider-gold mb-5" />

      {/* Dimension breakdown */}
      <div className="space-y-4">
        {dimensions.map((dim, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <dim.icon className="h-3 w-3" style={{ color: "var(--primary)" }} />
                <span className="text-xs text-foreground/70 tracking-wide">{dim.label}</span>
              </div>
              <span className="text-xs tabular-nums" style={{ color: "var(--primary)" }}>
                {dim.score}/{dim.maxScore}
              </span>
            </div>
            <div className="progress-thin">
              <div style={{ width: `${(dim.score / dim.maxScore) * 100}%` }} />
            </div>
            <div className="text-[10px] text-foreground/40 mt-1">{dim.explanation}</div>
          </div>
        ))}
      </div>

      {/* Suggestions — positive, never shaming */}
      <div className="divider-gold my-4" />
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-3 w-3" style={{ color: "var(--primary)" }} />
        <span className="micro-label-gold">How to grow</span>
      </div>
      <div className="space-y-1.5">
        {score.suggestions.map((s, i) => (
          <div key={i} className="text-xs text-foreground/55 leading-relaxed flex items-start gap-2">
            <span style={{ color: "var(--primary)", fontSize: 10 }}>•</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
