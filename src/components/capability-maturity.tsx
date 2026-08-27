"use client";

// ============================================================================
// CAPABILITY MATURITY MODEL — assess where each capability stands
// ============================================================================

import { useState } from "react";
import { Shield, TrendingUp, Brain, BookOpen, Users, Sparkles, Database, Globe, Award } from "lucide-react";

interface Capability {
  name: string;
  category: string;
  icon: any;
  level: number; // 1-5
  levelLabel: string;
  evidence: string[];
  nextStep: string;
}

const CAPABILITIES: Capability[] = [
  {
    name: "Family Savings",
    category: "Product",
    icon: TrendingUp,
    level: 4,
    levelLabel: "Scalable",
    evidence: ["Save money with balance validation", "Linked account debiting", "Transaction history", "Monthly summaries", "Streak tracking"],
    nextStep: "Recurring automated savings schedules",
  },
  {
    name: "Goals System",
    category: "Product",
    icon: Award,
    level: 4,
    levelLabel: "Scalable",
    evidence: ["Create/edit/delete goals", "Privacy (private/revealed)", "Cadence (weekly/monthly/annual)", "Per-owner cap (15)", "Graph progress", "Contributions"],
    nextStep: "Shared family goals + goal templates",
  },
  {
    name: "Spending Tracking",
    category: "Product",
    icon: Users,
    level: 4,
    levelLabel: "Scalable",
    evidence: ["Parent + child spending", "6 categories with budgets", "Per-child category breakdown", "Monthly trend analysis", "Family spending summary"],
    nextStep: "Receipt photo upload + spending predictions",
  },
  {
    name: "Token Economy",
    category: "Product",
    icon: Sparkles,
    level: 4,
    levelLabel: "Scalable",
    evidence: ["Black-box interface", "Award + redeem", "Ledger + balance", "60% incentive spread", "Immutable ledger entries"],
    nextStep: "Token marketplace + partner rewards",
  },
  {
    name: "Financial Education",
    category: "Education",
    icon: BookOpen,
    level: 3,
    levelLabel: "Stable",
    evidence: ["6 lessons with quizzes", "3 learning paths", "Sequential unlocking", "Certificate eligibility", "Progress tracking"],
    nextStep: "Adaptive curriculum + AI-generated lessons + multilingual content",
  },
  {
    name: "Achievement System",
    category: "Education",
    icon: Award,
    level: 3,
    levelLabel: "Stable",
    evidence: ["10 seeded achievements", "4 categories (savings, goals, education, spending)", "Streak tracking", "Badge tiers (bronze→platinum)", "Auto-evaluation engine"],
    nextStep: "Custom achievements + seasonal badges + family achievements",
  },
  {
    name: "AI Intelligence",
    category: "Intelligence",
    icon: Brain,
    level: 3,
    levelLabel: "Stable",
    evidence: ["AI financial coach (real LLM)", "Recommendation engine", "Parent insights with explainability", "Financial maturity score", "Guardrails enforced"],
    nextStep: "Voice coach + AI-generated lessons + predictive goal completion",
  },
  {
    name: "Analytics & Metrics",
    category: "Platform",
    icon: Database,
    level: 3,
    levelLabel: "Stable",
    evidence: ["Event tracking (7 event types)", "Metrics dashboard (5 categories)", "Family health dashboard", "Audit log", "System health endpoint"],
    nextStep: "Cohort analysis + retention curves + experimentation platform",
  },
  {
    name: "Trust & Privacy",
    category: "Institutional",
    icon: Shield,
    level: 4,
    levelLabel: "Scalable",
    evidence: ["Privacy Control Center", "Data export (JSON)", "AI preference toggles", "Institutional Constitution", "Family Bill of Rights"],
    nextStep: "Data deletion workflow + consent management + transparency reports",
  },
  {
    name: "API Platform",
    category: "Ecosystem",
    icon: Globe,
    level: 2,
    levelLabel: "Developing",
    evidence: ["7 v1 endpoints", "Consistent response envelope", "Versioned (URL-based)", "Developer documentation in-app"],
    nextStep: "Authentication + rate limiting + webhooks + SDK generation",
  },
  {
    name: "Multi-Tenancy",
    category: "Platform",
    icon: Users,
    level: 1,
    levelLabel: "Emerging",
    evidence: ["FamilyId on all models", "RBAC permissions defined", "Guard functions written"],
    nextStep: "NextAuth implementation + per-family data isolation + tenant onboarding",
  },
  {
    name: "Content Management",
    category: "Platform",
    icon: BookOpen,
    level: 1,
    levelLabel: "Emerging",
    evidence: ["Seed scripts for lessons/achievements", "Configuration model exists", "AdminAction audit model exists"],
    nextStep: "CMS with drafts/approvals/publishing + content versioning + localization",
  },
];

const LEVEL_COLORS = ["", "var(--chart-3)", "var(--chart-3)", "var(--primary)", "var(--chart-2)", "var(--chart-5)"];
const LEVEL_LABELS = ["", "Emerging", "Developing", "Stable", "Scalable", "Institutional"];

function MaturityBar({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-1.5 w-6 rounded-sm transition-all"
          style={{
            background: i <= level ? LEVEL_COLORS[level] : "var(--hairline-soft)",
          }}
        />
      ))}
    </div>
  );
}

export function CapabilityMaturityTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = Array.from(new Set(CAPABILITIES.map((c) => c.category)));

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1">Institutional Assessment</div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide">
          Capability Maturity Model
        </h3>
        <p className="text-xs text-foreground/45 mt-1 max-w-md leading-relaxed">
          Where each platform capability stands today. Levels: 1 (Emerging) → 2 (Developing) → 3 (Stable) → 4 (Scalable) → 5 (Institutional).
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((level) => {
          const count = CAPABILITIES.filter((c) => c.level === level).length;
          return (
            <div key={level} className="surface-flat rounded-lg p-3 text-center">
              <div className="font-editorial text-lg tabular-nums" style={{ color: LEVEL_COLORS[level] }}>
                {count}
              </div>
              <div className="text-[8px] text-foreground/40 mt-0.5">Level {level}</div>
              <div className="text-[7px] text-foreground/30">{LEVEL_LABELS[level]}</div>
            </div>
          );
        })}
      </div>

      {/* Capabilities by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <div className="micro-label-gold mb-2">{cat}</div>
          <div className="space-y-2">
            {CAPABILITIES.filter((c) => c.category === cat).map((cap) => {
              const isExpanded = expanded === cap.name;
              return (
                <div key={cap.name} className="surface-wood rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : cap.name)}
                    className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-[color-mix(in_srgb,var(--primary)_3%,transparent)] transition-colors"
                  >
                    <cap.icon className="h-4 w-4 shrink-0" style={{ color: LEVEL_COLORS[cap.level] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground tracking-wide">{cap.name}</div>
                      <div className="text-[10px] text-foreground/40 mt-0.5">
                        Level {cap.level} — {cap.levelLabel}
                      </div>
                    </div>
                    <MaturityBar level={cap.level} />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--hairline-soft)]">
                      <div>
                        <div className="micro-label mb-1">Evidence</div>
                        <ul className="space-y-1">
                          {cap.evidence.map((e, i) => (
                            <li key={i} className="text-[10px] text-foreground/55 flex items-start gap-2">
                              <span style={{ color: "var(--chart-2)" }}>✓</span>
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="micro-label mb-1">Next Step</div>
                        <p className="text-[10px] text-foreground/50 leading-relaxed">{cap.nextStep}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
