"use client";

// ============================================================================
// WHAT'S NEW — platform transparency feed
// ============================================================================

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Shield, BookOpen, Award, Brain, Palette, Database } from "lucide-react";

interface ChangeLogEntry {
  id: string;
  date: string;
  category: string;
  title: string;
  body: string;
  icon: string;
}

// Seeded changelog — in production this would come from the CMS/API
const CHANGELOG: ChangeLogEntry[] = [
  {
    id: "v3-ai-coach",
    date: "June 2026",
    category: "AI",
    title: "AI Financial Coach launched",
    body: "Children can now ask questions about money, saving, and budgeting to an AI coach with strict safety guardrails. The coach explains concepts in age-appropriate language and never gives investment advice.",
    icon: "Sparkles",
  },
  {
    id: "v3-learning-paths",
    date: "June 2026",
    category: "Education",
    title: "Structured Learning Paths with certificates",
    body: "Lessons are now organized into 3 curriculum paths: Money Foundations, Growing Your Money, and Money Mindset. Lessons unlock sequentially, and completing a path earns a certificate.",
    icon: "BookOpen",
  },
  {
    id: "v3-achievements",
    date: "June 2026",
    category: "Achievements",
    title: "Achievement system with 10 badges",
    body: "Children can now earn badges for saving consistently, completing goals, finishing lessons, and staying under budget. Streak tracking with a 48-hour grace period. No gambling psychology — just healthy habits.",
    icon: "Award",
  },
  {
    id: "v3-maturity-score",
    date: "June 2026",
    category: "AI",
    title: "Financial Maturity Score",
    body: "A transparent 4-dimension score (Saving Consistency, Goal Discipline, Budget Awareness, Financial Knowledge) that shows children exactly how they're growing. Every point is explainable.",
    icon: "Brain",
  },
  {
    id: "v3-insights",
    date: "June 2026",
    category: "AI",
    title: "Parent Insights with explainability",
    body: "Parents now see AI-generated insights about their children's saving and spending patterns. Every insight includes a 'Why am I seeing this?' explanation with confidence scoring.",
    icon: "TrendingUp",
  },
  {
    id: "v3-charter",
    date: "June 2026",
    category: "Family",
    title: "Family Charter system",
    body: "Families can now define their financial mission, saving principles, spending principles, house rules, and shared commitments. Children see the charter at the bottom of their dashboard.",
    icon: "Shield",
  },
  {
    id: "v3-themes",
    date: "June 2026",
    category: "Design",
    title: "Four editorial themes",
    body: "Onyx (dark green-black + gold), Ivory (warm paper + antique gold), Blush (rose-gold + wine), Oxblood (deep red + antique gold). Each theme has its own gold foil gradient for maximum contrast.",
    icon: "Palette",
  },
  {
    id: "v3-backend",
    date: "June 2026",
    category: "Platform",
    title: "Full database persistence",
    body: "All data now persists to SQLite via Prisma. 28+ database tables. Every save, spend, goal, and token award survives a page refresh. The app is no longer a mockup — it's a real persisted application.",
    icon: "Database",
  },
];

const ICON_MAP: Record<string, any> = {
  Sparkles, TrendingUp, Shield, BookOpen, Award, Brain, Palette, Database,
};

const CATEGORY_COLORS: Record<string, string> = {
  AI: "var(--primary)",
  Education: "var(--chart-2)",
  Achievements: "var(--chart-5)",
  Family: "var(--chart-3)",
  Design: "var(--chart-4)",
  Platform: "var(--chart-1)",
};

export function WhatsNewPanel() {
  const [entries] = useState<ChangeLogEntry[]>(CHANGELOG);
  const [filter, setFilter] = useState<string>("all");

  const categories = Array.from(new Set(entries.map((e) => e.category)));
  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> What's New
          </div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">
            Platform Updates
          </h3>
        </div>
        <span className="micro-label">{entries.length} updates</span>
      </div>
      <div className="divider-gold mb-4" />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-2 py-1 rounded text-[10px] tracking-wider uppercase ${
            filter === "all" ? "btn-gold" : "btn-outline"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-2 py-1 rounded text-[10px] tracking-wider uppercase ${
              filter === cat ? "btn-gold" : "btn-outline"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const Icon = ICON_MAP[entry.icon] ?? Sparkles;
          const color = CATEGORY_COLORS[entry.category] ?? "var(--primary)";
          return (
            <div key={entry.id} className="surface-flat rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid ${color}` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-editorial text-sm text-foreground tracking-wide">{entry.title}</span>
                    <span className="pill pill-muted" style={{ fontSize: 8 }}>{entry.category}</span>
                  </div>
                  <div className="text-xs text-foreground/55 leading-relaxed">{entry.body}</div>
                  <div className="text-[10px] text-foreground/35 mt-2">{entry.date}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
