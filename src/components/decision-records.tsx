"use client";

// ============================================================================
// DECISION RECORDS (ADRs) — architectural decision memory
// ============================================================================

import { useState } from "react";
import { FileText, Search, Plus, ChevronRight, Calendar, User } from "lucide-react";

interface ADR {
  id: string;
  number: number;
  title: string;
  status: "accepted" | "proposed" | "deprecated" | "superseded";
  date: string;
  context: string;
  decision: string;
  consequences: string;
  tags: string[];
}

const SEED_ADRS: ADR[] = [
  {
    id: "adr-001",
    number: 1,
    title: "Use Next.js 16 App Router with TypeScript",
    status: "accepted",
    date: "June 2026",
    context: "Planned needs a modern web framework that supports server-side rendering, API routes, and a component-based UI. The app must be SEO-friendly, fast, and maintainable for decades.",
    decision: "Use Next.js 16 with the App Router and TypeScript 5. App Router provides server components, streaming, and better data fetching. TypeScript ensures type safety across the codebase.",
    consequences: "Excellent DX, type safety, and ecosystem. Risk: Next.js major versions may introduce breaking changes. Mitigation: pin versions, test before upgrading.",
    tags: ["framework", "frontend", "typescript"],
  },
  {
    id: "adr-002",
    number: 2,
    title: "Use Prisma ORM with SQLite (dev) → PostgreSQL (prod)",
    status: "accepted",
    date: "June 2026",
    context: "Need a type-safe ORM that supports SQLite for development and PostgreSQL for production. Schema must support 28+ models with relations, indexes, and soft deletes.",
    decision: "Use Prisma ORM. SQLite for local dev (zero-config), PostgreSQL for production (row-level security, partitioning). Schema is database-agnostic.",
    consequences: "Type-safe queries, excellent DX, easy migration path. Risk: Prisma client cache issues in dev (mitigated with raw SQL fallbacks). Production: PostgreSQL handles 50M+ rows with partitioning.",
    tags: ["database", "orm", "infrastructure"],
  },
  {
    id: "adr-003",
    number: 3,
    title: "Use Zustand for UI state, server actions for mutations",
    status: "accepted",
    date: "June 2026",
    context: "Need a state management strategy that separates UI state (theme, modals, filters) from server state (transactions, goals, children). Avoid global mutable state for domain data.",
    decision: "Zustand holds ONLY UI state (theme, sidebar, modals, filters, optimistic updates). All domain data is fetched from the API and cached via React Query (or direct fetch with hydration). Mutations go through the persisted mutations module.",
    consequences: "Clean separation of concerns. No domain data in global state. Risk: dual hydration (Zustand seed → API). Mitigated with store-hydration.ts layer.",
    tags: ["state-management", "architecture"],
  },
  {
    id: "adr-004",
    number: 4,
    title: "Token economy is a black-box interface",
    status: "accepted",
    date: "June 2026",
    context: "The token economy has proprietary pricing formulas, incentive calculations, and reward algorithms. These must never be modified without domain-expert sign-off.",
    decision: "TokenService is an INTERFACE ONLY (award, redeem, getBalance, calculatePurchaseCost, calculateRedeemValue). The implementation delegates to existing rate constants (TOKEN_BUY_RATE=50, TOKEN_REDEEM_RATE=80). No business logic is exposed or invented.",
    consequences: "Token calculations are isolated. Future changes require interface-level approval. Risk: none — this is the correct pattern for proprietary domain logic.",
    tags: ["tokens", "domain", "architecture"],
  },
  {
    id: "adr-005",
    number: 5,
    title: "4-theme system with theme-specific gold foil gradients",
    status: "accepted",
    date: "June 2026",
    context: "The app needs multiple themes (dark, light, pink, red) but the gold foil text gradient was invisible on light backgrounds. Need theme-aware tokens.",
    decision: "Each theme defines its own --gold-foil-1/2/3 CSS variables. The .text-gold-foil class uses these tokens. On dark: bright gold shimmer. On ivory: antique gold. On pink: rose-gold. On red: antique gold with bright pop.",
    consequences: "Gold foil is visible on all 4 themes. Theme switching is instant (CSS variables). Risk: none — token-based theming is the correct approach.",
    tags: ["design", "themes", "css"],
  },
  {
    id: "adr-006",
    number: 6,
    title: "AI coach uses z-ai-web-dev-sdk with strict guardrails",
    status: "accepted",
    date: "June 2026",
    context: "Need an AI financial coach for children. Must be safe, educational, and never give investment advice. Must use a backend-only SDK.",
    decision: "Use z-ai-web-dev-sdk (GLM model) via /api/coach endpoint. System prompt enforces: no investment advice, no shaming, no sibling comparisons, no medical/legal advice. Context includes child's name, age, savings balance, and goal progress.",
    consequences: "Real LLM responses, age-appropriate, safe. Risk: hallucination (mitigated by system prompt + fallback responses). Rate limiting ready.",
    tags: ["ai", "coach", "safety"],
  },
  {
    id: "adr-007",
    number: 7,
    title: "API-First: every capability exposed as v1 endpoint",
    status: "accepted",
    date: "June 2026",
    context: "The platform must support future consumers (mobile apps, schools, partners, AI tutors). The web app should be one consumer, not the only consumer.",
    decision: "Every capability (families, children, goals, transactions, lessons, achievements, insights) is exposed via /api/v1/* with a consistent response envelope {data, meta: {version, timestamp}}. Versioned via URL. Old versions maintained 12+ months.",
    consequences: "Future consumers can use the same capabilities without touching the web app. Risk: API maintenance burden. Mitigated by versioning + documentation.",
    tags: ["api", "platform", "ecosystem"],
  },
  {
    id: "adr-008",
    number: 8,
    title: "Institutional Constitution visible to families",
    status: "accepted",
    date: "June 2026",
    context: "Planned aspires to be a trusted institution, not just an app. Families need to see what the institution stands for — its principles, rights, and non-negotiables.",
    decision: "Build a Constitution panel in Settings with 9 articles (Preamble, Mission, Beliefs, Principles, Family Bill of Rights, Responsibilities, Non-Negotiables, AI Constitution, Evolution Charter). Visible to all families. Versioned (v1.0).",
    consequences: "Families can read and hold Planned accountable to its commitments. Builds institutional trust. Risk: none — transparency is a trust accelerator.",
    tags: ["trust", "institution", "governance"],
  },
];

const STATUS_COLORS: Record<string, string> = {
  accepted: "var(--chart-2)",
  proposed: "var(--primary)",
  deprecated: "var(--chart-3)",
  superseded: "var(--destructive)",
};

export function DecisionRecordsTab() {
  const [adrs] = useState<ADR[]>(SEED_ADRS);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = adrs.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.includes(search.toLowerCase())) ||
      a.context.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="micro-label-gold mb-1 flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Decision Records
          </div>
          <h3 className="font-editorial text-lg text-foreground tracking-wide">
            Architecture Decision Records
          </h3>
          <p className="text-xs text-foreground/45 mt-1">
            Why architectural decisions were made. Preserved for future teams, AI systems, and institutional memory.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search decisions by title, tag, or context..."
          className="input-editorial w-full pl-9 pr-3 py-2 text-xs"
        />
      </div>

      {/* ADR list */}
      <div className="space-y-2">
        {filtered.map((adr) => {
          const isExpanded = expanded === adr.id;
          return (
            <div key={adr.id} className="surface-wood rounded-lg overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : adr.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[color-mix(in_srgb,var(--primary)_3%,transparent)] transition-colors"
              >
                <span className="font-editorial text-sm tabular-nums shrink-0" style={{ color: "var(--primary)" }}>
                  ADR-{String(adr.number).padStart(3, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground tracking-wide">{adr.title}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="pill"
                      style={{
                        fontSize: 8,
                        background: `color-mix(in srgb, ${STATUS_COLORS[adr.status]} 12%, transparent)`,
                        color: STATUS_COLORS[adr.status],
                        border: `1px solid color-mix(in srgb, ${STATUS_COLORS[adr.status]} 30%, transparent)`,
                      }}
                    >
                      {adr.status}
                    </span>
                    <span className="text-[9px] text-foreground/35 flex items-center gap-1">
                      <Calendar className="h-2 w-2" /> {adr.date}
                    </span>
                    <div className="flex gap-1">
                      {adr.tags.map((t) => (
                        <span key={t} className="text-[8px] font-mono text-foreground/30">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-foreground/30 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-[var(--hairline-soft)]">
                  <div>
                    <div className="micro-label-gold mb-1">Context</div>
                    <p className="text-xs text-foreground/60 leading-relaxed">{adr.context}</p>
                  </div>
                  <div>
                    <div className="micro-label-gold mb-1">Decision</div>
                    <p className="text-xs text-foreground/60 leading-relaxed">{adr.decision}</p>
                  </div>
                  <div>
                    <div className="micro-label-gold mb-1">Consequences</div>
                    <p className="text-xs text-foreground/60 leading-relaxed">{adr.consequences}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-[9px] text-foreground/30 italic">
        {adrs.length} decision records preserved. In production, ADRs would be managed via a CMS
        with proposal, review, and approval workflows.
      </div>
    </div>
  );
}
