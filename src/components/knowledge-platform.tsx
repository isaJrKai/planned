"use client";

// ============================================================================
// KNOWLEDGE PLATFORM — searchable institutional memory
// ============================================================================

import { useState } from "react";
import { Search, FileText, BookOpen, Lightbulb, Scale, Shield, TrendingUp, Database } from "lucide-react";

interface KnowledgeItem {
  id: string;
  type: "decision" | "lesson" | "principle" | "principle" | "doc" | "incident";
  title: string;
  summary: string;
  category: string;
  source: string;
}

// Aggregate all institutional knowledge into one searchable index
const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // Decisions
  { id: "adr-001", type: "decision", title: "Use Next.js 16 App Router with TypeScript", summary: "Chose Next.js for SSR, API routes, and component UI. TypeScript ensures type safety.", category: "Engineering", source: "ADR-001" },
  { id: "adr-002", type: "decision", title: "Use Prisma ORM with SQLite → PostgreSQL", summary: "Type-safe ORM. SQLite for dev, PostgreSQL for production. 28+ models.", category: "Engineering", source: "ADR-002" },
  { id: "adr-003", type: "decision", title: "Zustand for UI state only", summary: "Zustand holds theme/modals/filters. Domain data fetched from API.", category: "Architecture", source: "ADR-003" },
  { id: "adr-004", type: "decision", title: "Token economy is black-box interface", summary: "TokenService interface only. Never expose or invent token calculations.", category: "Domain", source: "ADR-004" },
  { id: "adr-005", type: "decision", title: "Theme-specific gold foil gradients", summary: "Each theme defines --gold-foil tokens so foil is visible on all backgrounds.", category: "Design", source: "ADR-005" },
  { id: "adr-006", type: "decision", title: "AI coach with z-ai-web-dev-sdk + guardrails", summary: "GLM model with strict system prompt. No investment advice, no shaming.", category: "AI", source: "ADR-006" },
  { id: "adr-007", type: "decision", title: "API-First: v1 endpoints for all capabilities", summary: "Every capability exposed as /api/v1/* with consistent envelope.", category: "Platform", source: "ADR-007" },
  { id: "adr-008", type: "decision", title: "Institutional Constitution visible to families", summary: "9-article constitution in Settings. Versioned. Builds institutional trust.", category: "Trust", source: "ADR-008" },
  // Lessons
  { id: "ll-001", type: "lesson", title: "Prisma client cache prevents querying new models", summary: "Running dev server doesn't pick up new models. Use raw SQL or Python fallback.", category: "Engineering", source: "Lesson Learned" },
  { id: "ll-002", type: "lesson", title: "Theme-specific gold foil solved visibility", summary: "Per-theme --gold-foil tokens. Pattern: use for ALL theme-dependent colors.", category: "Design", source: "Lesson Learned" },
  { id: "ll-003", type: "lesson", title: "Zustand selectors returning arrays cause infinite re-renders", summary: "Subscribe to RAW state, derive with useMemo. Never return new arrays from selectors.", category: "Engineering", source: "Lesson Learned" },
  { id: "ll-004", type: "lesson", title: "Store child IDs not objects to prevent stale state", summary: "Storing whole objects goes stale. Store IDs, look up from live store.", category: "Engineering", source: "Lesson Learned" },
  { id: "ll-005", type: "lesson", title: "AI system prompt must list what NOT to do", summary: "Explicit 'never' list is more effective than positive instructions alone.", category: "AI", source: "Lesson Learned" },
  { id: "ll-006", type: "lesson", title: "Explainability is the key differentiator for trust", summary: "'Why am I seeing this?' transforms AI from black box to transparent guide.", category: "Product", source: "Lesson Learned" },
  { id: "ll-007", type: "lesson", title: "Sequential lesson unlocking creates curriculum", summary: "Locking lesson 2 until 1 is done transforms flat list into structured path.", category: "Education", source: "Lesson Learned" },
  { id: "ll-008", type: "lesson", title: "Sidebar hardcoded color didn't change with theme", summary: "NEVER hardcode colors in JSX. Always use CSS variables.", category: "Engineering", source: "Lesson Learned" },
  // Principles
  { id: "p-001", type: "principle", title: "Trust First", summary: "Every decision evaluated: does this increase or decrease family trust?", category: "Institutional", source: "Constitution" },
  { id: "p-002", type: "principle", title: "Simplicity Scales", summary: "Simple systems survive decades. Complex systems break.", category: "Institutional", source: "Constitution" },
  { id: "p-003", type: "principle", title: "Education Over Entertainment", summary: "Teach through action and reflection, not dopamine loops.", category: "Institutional", source: "Constitution" },
  { id: "p-004", type: "principle", title: "Privacy as a Right", summary: "Never sell data, never profile sensitive characteristics.", category: "Institutional", source: "Constitution" },
  { id: "p-005", type: "principle", title: "Transparency by Default", summary: "Every score, recommendation, and insight explains itself.", category: "Institutional", source: "Constitution" },
  { id: "p-006", type: "principle", title: "AI teaches, never manipulates", summary: "AI exists to explain, encourage, educate. Never uses urgency or guilt.", category: "AI", source: "AI Constitution" },
  { id: "p-007", type: "principle", title: "No dark patterns", summary: "Never use manipulation, artificial urgency, or deceptive design.", category: "Guardrails", source: "Constitution" },
  { id: "p-008", type: "principle", title: "No shaming", summary: "Never shame a child for spending or judge a family's choices.", category: "Guardrails", source: "Constitution" },
];

const TYPE_CONFIG = {
  decision: { icon: Scale, color: "var(--primary)", label: "Decision" },
  lesson: { icon: Lightbulb, color: "var(--chart-3)", label: "Lesson" },
  principle: { icon: Shield, color: "var(--chart-2)", label: "Principle" },
  doc: { icon: FileText, color: "var(--chart-5)", label: "Document" },
  incident: { icon: TrendingUp, color: "var(--destructive)", label: "Incident" },
};

export function KnowledgePlatformTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = KNOWLEDGE_BASE.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) ||
             item.summary.toLowerCase().includes(q) ||
             item.category.toLowerCase().includes(q) ||
             item.source.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1 flex items-center gap-1.5">
          <Database className="h-3 w-3" /> Institutional Memory
        </div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide">
          Knowledge Platform
        </h3>
        <p className="text-xs text-foreground/45 mt-1 max-w-md leading-relaxed">
          Searchable index of all institutional knowledge: decisions, lessons, principles, and documents.
          Preserved for future teams, AI systems, and institutional continuity.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all knowledge — decisions, lessons, principles..."
          className="input-editorial w-full pl-9 pr-3 py-2.5 text-xs"
          autoFocus
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded text-[10px] tracking-wider uppercase ${filter === "all" ? "btn-gold" : "btn-outline"}`}>
          All ({KNOWLEDGE_BASE.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const count = KNOWLEDGE_BASE.filter((k) => k.type === type).length;
          if (count === 0) return null;
          return (
            <button key={type} onClick={() => setFilter(type)} className={`px-2 py-1 rounded text-[10px] tracking-wider uppercase ${filter === type ? "btn-gold" : "btn-outline"}`}>
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="text-[10px] text-foreground/40">
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Results */}
      <div className="space-y-2">
        {filtered.map((item) => {
          const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.doc;
          return (
            <div key={item.id} className="surface-wood rounded-lg p-4 flex items-start gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `color-mix(in srgb, ${config.color} 12%, transparent)`, border: `1px solid ${config.color}` }}
              >
                <config.icon className="h-3.5 w-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-editorial text-sm text-foreground tracking-wide">{item.title}</span>
                  <span className="pill pill-muted" style={{ fontSize: 7 }}>{config.label}</span>
                </div>
                <p className="text-xs text-foreground/55 leading-relaxed mb-1">{item.summary}</p>
                <div className="flex items-center gap-2 text-[9px] text-foreground/35">
                  <span className="pill pill-muted" style={{ fontSize: 7 }}>{item.category}</span>
                  <span>· {item.source}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <div className="empty-state-title">No results</div>
            <div className="empty-state-body">Try a different search term or filter.</div>
          </div>
        )}
      </div>

      <div className="text-center text-[9px] text-foreground/30 italic">
        {KNOWLEDGE_BASE.length} knowledge items indexed. In production, this would use semantic search
        with embeddings + AI retrieval for natural language queries.
      </div>
    </div>
  );
}
