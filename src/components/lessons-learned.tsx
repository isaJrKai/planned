"use client";

// ============================================================================
// LESSONS LEARNED — institutional knowledge capture
// ============================================================================

import { useState } from "react";
import { Lightbulb, AlertTriangle, CheckCircle2, BookOpen, Search, Plus, X } from "lucide-react";

interface Lesson {
  id: string;
  type: "success" | "failure" | "insight" | "discovery";
  title: string;
  body: string;
  category: string;
  date: string;
  source: string;
}

const SEED_LESSONS: Lesson[] = [
  {
    id: "ll-001",
    type: "failure",
    title: "Prisma client cache prevents querying new models",
    body: "When new Prisma models are added via db:push, the running dev server's Prisma client doesn't pick them up. Typed queries (db.analyticsEvent.findMany) fail with P2010. Fix: use $queryRawUnsafe for COUNT (works), or Python subprocess for SELECT (bypasses Prisma entirely). Root cause: globalForPrisma caches the PrismaClient instance. Mitigation: version-based cache busting in db.ts + raw SQL fallbacks in all API routes that touch new models.",
    category: "Engineering",
    date: "June 2026",
    source: "Backend wiring session",
  },
  {
    id: "ll-002",
    type: "success",
    title: "Theme-specific gold foil gradients solved visibility issue",
    body: "The original gold foil gradient (#C9A84C → #E8D5A0 → #D4AF37) was invisible on light/pink/red backgrounds. Solution: each theme defines its own --gold-foil-1/2/3 tokens. Dark uses bright gold, ivory uses antique gold, pink uses rose-gold, red uses antique gold with bright pop. The .text-gold-foil class uses var() so it adapts instantly. This pattern should be used for ALL theme-dependent colors.",
    category: "Design",
    date: "June 2026",
    source: "Theme system redesign",
  },
  {
    id: "ll-003",
    type: "insight",
    title: "Zustand selectors returning arrays cause infinite re-renders",
    body: "Any Zustand selector that returns a new array (e.g., .filter().sort()) causes infinite re-renders because the array reference changes on every call. Solution: subscribe to RAW state (e.g., useStore((s) => s.spending)) and derive with useMemo in the component. This pattern must be followed for ALL array-returning selectors.",
    category: "Engineering",
    date: "June 2026",
    source: "Child dashboard development",
  },
  {
    id: "ll-004",
    type: "success",
    title: "Storing child IDs instead of objects prevents stale state",
    body: "Initially, activeChild was stored as a whole Child object in useState. When the store updated the child's balance, the saved reference was stale. Fix: store only the childId, then look it up from the live store on every render: const activeChild = childList.find(c => c.id === activeChildId). This ensures the child's balance is always current.",
    category: "Engineering",
    date: "June 2026",
    source: "Bug #1 fix (save modal)",
  },
  {
    id: "ll-005",
    type: "insight",
    title: "AI coach system prompt must be explicit about what NOT to do",
    body: "The AI coach's system prompt doesn't just say what to do (explain concepts, encourage saving) — it explicitly lists what NOT to do: no investment advice, no return predictions, no shaming, no sibling comparisons, no medical/legal advice. This is more effective than positive instructions alone. The 'never' list is the safety net.",
    category: "AI",
    date: "June 2026",
    source: "AI coach development",
  },
  {
    id: "ll-006",
    type: "discovery",
    title: "Explainability is the key differentiator for family trust",
    body: "Adding 'Why am I seeing this?' to every AI insight, with confidence scoring and data source explanation, transforms the experience from 'AI is telling me things' to 'AI is showing me its reasoning.' This is the kind of transparency that makes Planned feel like a trusted institution, not a black box. Every future AI feature should include explainability from day one.",
    category: "Product",
    date: "June 2026",
    source: "Parent insights development",
  },
  {
    id: "ll-007",
    type: "insight",
    title: "Sequential lesson unlocking creates curriculum structure",
    body: "Locking lesson 2 until lesson 1 is completed transforms a flat lesson list into a structured curriculum. Children can't skip ahead, which ensures foundational concepts are learned before advanced ones. Combined with learning paths (grouping lessons by theme), this creates a real educational progression — not just a content library.",
    category: "Education",
    date: "June 2026",
    source: "Learning paths development",
  },
  {
    id: "ll-008",
    type: "failure",
    title: "Sidebar used hardcoded bg color, didn't change with theme",
    body: "The sidebar element used bg-[#0B0F0D] (hardcoded dark green-black), ignoring the theme system. When switching to Ivory/Pink/Red themes, the sidebar stayed dark while everything else changed. Fix: replace with bg-sidebar + var(--sidebar-border) tokens. Lesson: NEVER hardcode colors in component JSX. Always use CSS variables. Audit the entire codebase for hardcoded hex values after any theme work.",
    category: "Engineering",
    date: "June 2026",
    source: "User-reported bug",
  },
];

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, color: "var(--chart-2)", label: "Success" },
  failure: { icon: AlertTriangle, color: "var(--destructive)", label: "Failure" },
  insight: { icon: Lightbulb, color: "var(--primary)", label: "Insight" },
  discovery: { icon: BookOpen, color: "var(--chart-5)", label: "Discovery" },
};

export function LessonsLearnedTab() {
  const [lessons] = useState<Lesson[]>(SEED_LESSONS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = lessons.filter((l) => {
    if (filter !== "all" && l.type !== filter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-1 flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3" /> Institutional Memory
        </div>
        <h3 className="font-editorial text-lg text-foreground tracking-wide">
          Lessons Learned
        </h3>
        <p className="text-xs text-foreground/45 mt-1 max-w-md leading-relaxed">
          Successes, failures, insights, and discoveries preserved for future teams.
          Institutional memory that survives personnel changes and technology shifts.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lessons..."
            className="input-editorial w-full pl-9 pr-3 py-2 text-xs"
          />
        </div>
        <div className="flex gap-1">
          {["all", "success", "failure", "insight", "discovery"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2 py-1 rounded text-[10px] tracking-wider uppercase ${
                filter === t ? "btn-gold" : "btn-outline"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {filtered.map((lesson) => {
          const config = TYPE_CONFIG[lesson.type];
          return (
            <div key={lesson.id} className="surface-wood rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `color-mix(in srgb, ${config.color} 12%, transparent)`, border: `1px solid ${config.color}` }}
                >
                  <config.icon className="h-4 w-4" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-editorial text-sm text-foreground tracking-wide">{lesson.title}</span>
                    <span
                      className="pill"
                      style={{
                        fontSize: 7,
                        background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                        color: config.color,
                        border: `1px solid color-mix(in srgb, ${config.color} 30%, transparent)`,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/55 leading-relaxed mb-2">{lesson.body}</p>
                  <div className="flex items-center gap-3 text-[9px] text-foreground/35">
                    <span className="pill pill-muted" style={{ fontSize: 7 }}>{lesson.category}</span>
                    <span>{lesson.date}</span>
                    <span>· {lesson.source}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-[9px] text-foreground/30 italic">
        {lessons.length} lessons preserved. In production, lessons would be submitted via a form
        with review and approval workflows, and linked to ADRs and incidents.
      </div>
    </div>
  );
}
