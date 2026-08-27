"use client";

// ============================================================================
// 20-YEAR ROADMAP — interactive institutional timeline
// ============================================================================

import { useState } from "react";
import { TrendingUp, Rocket, Globe, Crown, Sparkles, ChevronRight } from "lucide-react";

type Phase = "now" | "1-2yr" | "3-5yr" | "5-10yr" | "10-20yr";

interface RoadmapPhase {
  id: Phase;
  period: string;
  title: string;
  subtitle: string;
  icon: any;
  status: "complete" | "in-progress" | "planned" | "vision";
  items: { label: string; done: boolean }[];
}

const PHASES: RoadmapPhase[] = [
  {
    id: "now",
    period: "Now",
    title: "The Foundation",
    subtitle: "What's built and working today",
    icon: Sparkles,
    status: "in-progress",
    items: [
      { label: "Family savings, goals, spending tracking", done: true },
      { label: "6 financial literacy lessons with quizzes", done: true },
      { label: "3 structured learning paths with certificates", done: true },
      { label: "AI financial coach with safety guardrails", done: true },
      { label: "10 achievements + streaks + badges", done: true },
      { label: "Parent insights with explainability", done: true },
      { label: "Financial Maturity Score (4 dimensions)", done: true },
      { label: "Family Charter system", done: true },
      { label: "4 editorial themes (Onyx, Ivory, Blush, Oxblood)", done: true },
      { label: "Full database persistence (28+ tables)", done: true },
      { label: "Institutional Constitution", done: true },
      { label: "Public API v1 (7 endpoints)", done: true },
      { label: "Privacy & Data Control Center", done: true },
      { label: "Admin panel with metrics, health, audit log", done: true },
      { label: "Mobile bottom navigation", done: true },
      { label: "Recommendation engine", done: true },
      { label: "Analytics event tracking", done: true },
      { label: "Feature flag system (10 flags)", done: true },
    ],
  },
  {
    id: "1-2yr",
    period: "1–2 Years",
    title: "The Platform",
    subtitle: "Multi-user, multi-device, multi-currency",
    icon: Rocket,
    status: "planned",
    items: [
      { label: "Multi-family authentication (NextAuth + RBAC)", done: false },
      { label: "PWA + native mobile apps", done: false },
      { label: "Multi-currency support (UGX, USD, KES, TZS, RWF)", done: false },
      { label: "Monthly PDF reports + CSV exports", done: false },
      { label: "Push notifications + email summaries", done: false },
      { label: "School + community organization pilots", done: false },
      { label: "PostgreSQL migration for scale", done: false },
      { label: "S3/Cloudinary for avatar storage", done: false },
      { label: "Vercel Cron for scheduled jobs", done: false },
      { label: "Decision Records (ADR) system", done: false },
    ],
  },
  {
    id: "3-5yr",
    period: "3–5 Years",
    title: "The Ecosystem",
    subtitle: "Real integrations, adaptive learning, partner APIs",
    icon: Globe,
    status: "vision",
    items: [
      { label: "Real broker integration (USE + regional)", done: false },
      { label: "Family chat + shared goal challenges", done: false },
      { label: "Adaptive curriculum based on behavior", done: false },
      { label: "AI-generated personalized lessons", done: false },
      { label: "Partner API for schools + financial educators", done: false },
      { label: "Marketplace for family rewards", done: false },
      { label: "Voice coach + multilingual support", done: false },
      { label: "Capability Maturity Model in admin", done: false },
    ],
  },
  {
    id: "5-10yr",
    period: "5–10 Years",
    title: "The Category",
    subtitle: "Default platform for family financial education",
    icon: TrendingUp,
    status: "vision",
    items: [
      { label: "The default platform for family financial education", done: false },
      { label: "Voice coach + multilingual AI", done: false },
      { label: "Bank integrations (real-time balance sync)", done: false },
      { label: "Family office features for wealthier families", done: false },
      { label: "Research-backed curriculum used by schools nationally", done: false },
      { label: "Category-defining brand in family finance", done: false },
      { label: "Government financial literacy partnerships", done: false },
    ],
  },
  {
    id: "10-20yr",
    period: "10–20 Years",
    title: "The Institution",
    subtitle: "Trusted family financial mentor across generations",
    icon: Crown,
    status: "vision",
    items: [
      { label: "The trusted family financial mentor across generations", done: false },
      { label: "Intergenerational wealth planning tools", done: false },
      { label: "Financial literacy standards adopted by education systems", done: false },
      { label: "Global presence across Africa, Asia, Latin America", done: false },
      { label: "The brand families associate with financial wellbeing — the way LEGO means play", done: false },
    ],
  },
];

export function RoadmapPanel() {
  const [activePhase, setActivePhase] = useState<Phase>("now");
  const current = PHASES.find((p) => p.id === activePhase)!;

  return (
    <div className="surface-wood rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <div className="micro-label-gold">Institutional Roadmap</div>
      </div>
      <h3 className="font-editorial text-lg text-foreground tracking-wide mb-2">
        Our 20-Year Journey
      </h3>
      <p className="text-xs text-foreground/50 mb-5 max-w-md leading-relaxed">
        Where Planned is today and where it's going. Every phase builds on the last —
        no rewrites, no drift, just disciplined evolution.
      </p>
      <div className="divider-gold mb-5" />

      {/* Timeline */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {PHASES.map((phase, i) => (
          <div key={phase.id} className="flex items-center shrink-0">
            <button
              onClick={() => setActivePhase(phase.id)}
              className={`px-3 py-2 rounded text-[10px] tracking-wider uppercase flex flex-col items-center gap-1 transition-all min-w-[80px] ${
                activePhase === phase.id ? "btn-gold" : "btn-outline"
              }`}
            >
              <phase.icon className="h-3 w-3" />
              <span>{phase.period}</span>
            </button>
            {i < PHASES.length - 1 && (
              <ChevronRight className="h-3 w-3 text-foreground/20 shrink-0 mx-0.5" />
            )}
          </div>
        ))}
      </div>

      {/* Active phase detail */}
      <div className="surface-flat rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: current.status === "in-progress"
                ? "color-mix(in srgb, var(--chart-2) 15%, transparent)"
                : "color-mix(in srgb, var(--primary) 8%, transparent)",
              border: `1px solid ${current.status === "in-progress" ? "var(--chart-2)" : "var(--hairline)"}`,
            }}
          >
            <current.icon className="h-5 w-5" style={{
              color: current.status === "in-progress" ? "var(--chart-2)" : "var(--primary)",
            }} />
          </div>
          <div>
            <div className="font-editorial text-base text-foreground tracking-wide">{current.title}</div>
            <div className="text-xs text-foreground/50">{current.subtitle}</div>
          </div>
          <div className="ml-auto">
            <span className={`pill ${
              current.status === "in-progress" ? "pill-green" :
              current.status === "planned" ? "pill-amber" : "pill-muted"
            }`}>
              {current.status === "in-progress" ? "In Progress" :
               current.status === "planned" ? "Planned" : "Vision"}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {current.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {item.done ? (
                <span style={{ color: "var(--chart-2)" }}>✓</span>
              ) : (
                <span style={{ color: "var(--text-faint)" }}>○</span>
              )}
              <span className={item.done ? "text-foreground/60" : "text-foreground/50"}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Progress for in-progress phase */}
        {current.status === "in-progress" && (
          <div className="mt-4 pt-3 border-t border-[var(--hairline-soft)]">
            <div className="flex justify-between text-[10px] text-foreground/40 mb-1.5">
              <span>Completed</span>
              <span>{current.items.filter((i) => i.done).length}/{current.items.length}</span>
            </div>
            <div className="progress-thin">
              <div style={{
                width: `${(current.items.filter((i) => i.done).length / current.items.length) * 100}%`,
              }} />
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[9px] text-foreground/30 mt-4 italic">
        This roadmap is a living document. It evolves as the institution grows,
        but the mission and principles remain constant.
      </div>
    </div>
  );
}
