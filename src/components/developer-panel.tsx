"use client";

// ============================================================================
// DEVELOPER PLATFORM — API documentation in the app
// ============================================================================

import { useState } from "react";
import { Code2, Copy, Check, Terminal, Webhook, Database, Sparkles, BookOpen } from "lucide-react";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  description: string;
  params?: string;
  example: string;
  responseKeys: string[];
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/families",
    description: "Get family info, members (parents + children), settings, and annual theme.",
    example: `curl https://planned.app/api/v1/families`,
    responseKeys: ["family.id", "family.name", "family.annualTheme", "family.monthlyQuote", "family.members.parents[]", "family.members.children[]"],
  },
  {
    method: "GET",
    path: "/api/v1/children",
    description: "List all children with savings balances, goals, and ages.",
    example: `curl https://planned.app/api/v1/children`,
    responseKeys: ["children[].id", "children[].name", "children[].age", "children[].currentAmount", "children[].goalAmount"],
  },
  {
    method: "GET",
    path: "/api/v1/goals",
    description: "List all goals with progress percentages, cadence, and visibility.",
    example: `curl https://planned.app/api/v1/goals`,
    responseKeys: ["goals[].id", "goals[].title", "goals[].type", "goals[].progressPct", "goals[].cadence", "goals[].visibility"],
  },
  {
    method: "GET",
    path: "/api/v1/transactions",
    description: "List transactions, optionally filtered by childId. Supports limit (max 100).",
    params: "childId (optional), limit (optional, default 50, max 100)",
    example: `curl "https://planned.app/api/v1/transactions?childId=zara&limit=10"`,
    responseKeys: ["transactions[].id", "transactions[].type", "transactions[].amount", "transactions[].timestamp"],
  },
  {
    method: "GET",
    path: "/api/v1/lessons",
    description: "List all financial literacy lessons with subjects, difficulty, and age ranges.",
    example: `curl https://planned.app/api/v1/lessons`,
    responseKeys: ["lessons[].slug", "lessons[].title", "lessons[].subject", "lessons[].difficulty", "lessons[].estimatedMinutes"],
  },
  {
    method: "GET",
    path: "/api/v1/achievements",
    description: "List all achievement definitions with codes, tiers, and point values.",
    example: `curl https://planned.app/api/v1/achievements`,
    responseKeys: ["achievements[].code", "achievements[].title", "achievements[].tier", "achievements[].points", "achievements[].category"],
  },
  {
    method: "GET",
    path: "/api/v1/insights",
    description: "Get AI-generated insights with explainability ('why' field + confidence).",
    example: `curl https://planned.app/api/v1/insights`,
    responseKeys: ["insights[].title", "insights[].body", "insights[].why", "insights[].confidence", "insights[].type"],
  },
];

const PRINCIPLES = [
  { icon: Code2, title: "API-First", body: "Every capability is designed as an API first. The web app is merely one consumer. Tomorrow another consumer could be a mobile app, school dashboard, or AI tutor." },
  { icon: Database, title: "Versioned", body: "URL-based versioning (/api/v1/). Old versions maintained for 12+ months after v2 ships. Breaking changes require new major version. Additive changes are non-breaking." },
  { icon: Webhook, title: "Event-Driven", body: "Domain events (SavingsDeposited, GoalCompleted, LessonCompleted) are published via EventBus. Future: webhook subscriptions for real-time partner integrations." },
  { icon: Terminal, title: "Typed Contracts", body: "Every request and response has a TypeScript interface. Responses follow a consistent envelope: { data, meta: { version, timestamp } }." },
  { icon: Sparkles, title: "Capability, Not Screen", body: "Goals are not a 'Goal Screen' — they're a Goal Capability with APIs, events, permissions, analytics, and extension points. Multiple consumers can use the same capability." },
  { icon: BookOpen, title: "Documented", body: "Every endpoint is self-documenting via this page. In production: OpenAPI spec + interactive explorer + SDK generation." },
];

export function DeveloperPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1 flex items-center gap-1.5">
          <Terminal className="h-3 w-3" /> Developer Platform
        </div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide">
          Public API v1
        </h2>
        <p className="text-xs text-foreground/55 mt-1 max-w-xl leading-relaxed">
          Planned is API-first. Every capability — savings, goals, education, achievements, insights —
          is exposed as a versioned API endpoint. The web app is one consumer. Mobile apps, schools,
          partners, and AI tutors can consume the same capabilities.
        </p>
      </div>

      {/* Principles */}
      <div className="grid md:grid-cols-3 gap-3 stagger">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="surface-wood rounded-lg p-4">
            <p.icon className="h-4 w-4 mb-2" style={{ color: "var(--primary)" }} />
            <div className="font-editorial text-sm text-foreground tracking-wide mb-1">{p.title}</div>
            <div className="text-[10px] text-foreground/50 leading-relaxed">{p.body}</div>
          </div>
        ))}
      </div>

      {/* Endpoint documentation */}
      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[var(--hairline)]">
          <div className="micro-label-gold mb-1">REST API</div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">Endpoints</h3>
          <p className="text-xs text-foreground/45 mt-1">
            All responses use envelope: {"{ data: T, meta: { version, timestamp } }"}
          </p>
        </div>

        <div className="divide-y divide-[var(--hairline-soft)]">
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="px-6 py-5">
              {/* Method + Path */}
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="pill"
                  style={{
                    fontSize: 9,
                    background: ep.method === "GET" ? "color-mix(in srgb, var(--chart-2) 12%, transparent)" : "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: ep.method === "GET" ? "var(--chart-2)" : "var(--primary)",
                    border: `1px solid ${ep.method === "GET" ? "var(--chart-2)" : "var(--primary)"}`,
                  }}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-mono text-foreground/80">{ep.path}</code>
              </div>

              {/* Description */}
              <p className="text-xs text-foreground/55 mb-2">{ep.description}</p>

              {/* Params */}
              {ep.params && (
                <div className="text-[10px] text-foreground/40 mb-2">
                  <span className="font-mono">Params:</span> {ep.params}
                </div>
              )}

              {/* Example */}
              <div className="surface-flat rounded p-3 mb-2 flex items-center justify-between gap-2">
                <code className="text-[10px] font-mono text-foreground/60 overflow-x-auto flex-1">
                  {ep.example}
                </code>
                <button
                  onClick={() => copy(ep.example, `ex-${i}`)}
                  className="btn-ghost p-1 rounded shrink-0"
                  aria-label="Copy"
                >
                  {copied === `ex-${i}` ? <Check className="h-3 w-3" style={{ color: "var(--chart-2)" }} /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              {/* Response keys */}
              <div className="flex flex-wrap gap-1.5">
                {ep.responseKeys.map((key) => (
                  <code key={key} className="text-[9px] font-mono px-1.5 py-0.5 rounded surface-flat" style={{ color: "var(--text-softer)" }}>
                    {key}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future endpoints */}
      <div className="surface-wood rounded-lg p-5">
        <div className="micro-label-gold mb-2">Planned Future Endpoints</div>
        <div className="divider-gold mb-4" />
        <div className="grid grid-cols-2 gap-3 text-xs text-foreground/50">
          <div><code className="font-mono">POST /api/v1/goals</code> — Create goal</div>
          <div><code className="font-mono">POST /api/v1/transactions</code> — Record save</div>
          <div><code className="font-mono">POST /api/v1/lessons/complete</code> — Submit quiz</div>
          <div><code className="font-mono">GET /api/v1/metrics</code> — Platform analytics</div>
          <div><code className="font-mono">GET /api/v1/health</code> — System health</div>
          <div><code className="font-mono">POST /api/v1/webhooks/subscribe</code> — Event subscription</div>
          <div><code className="font-mono">GET /api/v1/schools/:id/classes</code> — School extension</div>
          <div><code className="font-mono">GET /api/v1/partners/content</code> — Partner content</div>
        </div>
      </div>
    </div>
  );
}
