"use client";

// ============================================================================
// FOUNDER DASHBOARD — institutional stewardship scorecard
// ============================================================================

import { useState } from "react";
import { Compass, AlertTriangle, CheckCircle2, TrendingUp, Brain, Heart, Scale, Zap } from "lucide-react";

const PRINCIPLES = [
  { title: "Long-term thinking", question: "Was this decision evaluated on a 20-year horizon?", status: true },
  { title: "Truth seeking", question: "Did we seek evidence before deciding?", status: true },
  { title: "Simplicity", question: "Is this the simplest solution that works?", status: true },
  { title: "Trust preservation", question: "Does this increase or decrease family trust?", status: true },
  { title: "Educational integrity", question: "Does this teach, or does it entertain?", status: true },
  { title: "Humility", question: "Did we consider that we might be wrong?", status: true },
];

const ANTI_PATTERNS = [
  { title: "Short-term thinking", risk: "Optimizing for this quarter at the expense of next decade", status: "clear" },
  { title: "Feature obsession", risk: "Adding features instead of deepening existing ones", status: "clear" },
  { title: "Complexity addiction", risk: "Adding architecture before it's needed", status: "clear" },
  { title: "Ego", risk: "Building for self instead of for families", status: "clear" },
  { title: "Decision paralysis", risk: "Overthinking instead of shipping", status: "watch" },
  { title: "Burnout", risk: "Sustainable pace matters more than sprint speed", status: "clear" },
  { title: "Mission drift", risk: "Chasing opportunities that don't serve the mission", status: "clear" },
  { title: "Overconfidence", risk: "Assuming we know more than we do", status: "clear" },
  { title: "Under-learning", risk: "Not capturing lessons from failures", status: "clear" },
  { title: "Poor prioritization", risk: "Working on urgent instead of important", status: "watch" },
];

const MENTAL_MODELS = [
  { name: "First Principles", desc: "Break problems to fundamental truths, then build up.", use: "When facing novel challenges with no precedent." },
  { name: "Inversion", desc: "Ask 'What would guarantee failure?' then avoid that.", use: "When risk assessment matters more than optimization." },
  { name: "Second-Order Effects", desc: "Ask 'And then what?' after every decision.", use: "When decisions have long-term compounding consequences." },
  { name: "Opportunity Cost", desc: "Every yes is a no to something else.", use: "When prioritizing limited resources." },
  { name: "Margin of Safety", desc: "Build buffers for uncertainty.", use: "When reliability matters more than efficiency." },
  { name: "Lollapalooza Effect", desc: "Multiple forces acting in the same direction create extreme outcomes.", use: "When designing habit systems." },
  { name: "Circle of Competence", desc: "Know what you know and what you don't.", use: "When deciding what to build vs. partner." },
  { name: "Via Negativa", desc: "Improvement by subtraction, not addition.", use: "When the product feels cluttered." },
];

export function FounderDashboard() {
  const [tab, setTab] = useState<"principles" | "antipatterns" | "models">("principles");

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1 flex items-center gap-1.5">
          <Compass className="h-3 w-3" /> Institutional Stewardship
        </div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide">
          Founder Operating System
        </h3>
        <p className="text-xs text-foreground/45 mt-1 max-w-md leading-relaxed">
          Principles, anti-patterns, and mental models for stewarding Planned with clarity, humility, and long-term thinking.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("principles")} className={`px-3 py-1.5 rounded text-[10px] tracking-wider uppercase ${tab === "principles" ? "btn-gold" : "btn-outline"}`}>
          Principles
        </button>
        <button onClick={() => setTab("antipatterns")} className={`px-3 py-1.5 rounded text-[10px] tracking-wider uppercase ${tab === "antipatterns" ? "btn-gold" : "btn-outline"}`}>
          Anti-Patterns
        </button>
        <button onClick={() => setTab("models")} className={`px-3 py-1.5 rounded text-[10px] tracking-wider uppercase ${tab === "models" ? "btn-gold" : "btn-outline"}`}>
          Mental Models
        </button>
      </div>

      <div className="divider-gold" />

      {/* Principles */}
      {tab === "principles" && (
        <div className="space-y-3 stagger">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="surface-wood rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--chart-2)" }} />
              <div>
                <div className="font-editorial text-sm text-foreground tracking-wide">{p.title}</div>
                <div className="text-[10px] text-foreground/50 mt-0.5 italic">{p.question}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anti-patterns */}
      {tab === "antipatterns" && (
        <div className="space-y-3 stagger">
          {ANTI_PATTERNS.map((a) => (
            <div key={a.title} className="surface-wood rounded-lg p-4 flex items-start gap-3" style={{
              borderLeft: a.status === "watch" ? "3px solid var(--chart-3)" : "3px solid var(--hairline)",
            }}>
              {a.status === "clear" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--chart-2)" }} />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--chart-3)" }} />
              )}
              <div>
                <div className="font-editorial text-sm text-foreground tracking-wide">{a.title}</div>
                <div className="text-[10px] text-foreground/50 mt-0.5">{a.risk}</div>
                <span className={`pill mt-1 ${a.status === "clear" ? "pill-green" : "pill-amber"}`} style={{ fontSize: 7 }}>
                  {a.status === "clear" ? "Clear" : "Watch"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mental models */}
      {tab === "models" && (
        <div className="space-y-3 stagger">
          {MENTAL_MODELS.map((m) => (
            <div key={m.name} className="surface-wood rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                <span className="font-editorial text-sm text-foreground tracking-wide">{m.name}</span>
              </div>
              <div className="text-xs text-foreground/55 leading-relaxed mb-1">{m.desc}</div>
              <div className="text-[10px] text-foreground/40 italic">Use: {m.use}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
