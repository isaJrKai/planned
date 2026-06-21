"use client";

// ============================================================================
// PARENT QUICK ACTIONS — Search, Notifications, Log Spend FAB
// ============================================================================
// Three functional pieces that make the parent dashboard feel alive:
//   1. SearchOverlay  — Cmd+K / click-search-icon command palette that finds
//                       children, transactions, goals, spending entries by query
//   2. NotificationsDropdown — dropdown showing recent milestones derived from
//                       store activity (savings, tokens, goals, spending)
//   3. LogSpendFab    — floating action button bottom-right, always visible,
//                       opens the AddSpendingModal with an owner picker
// ============================================================================

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Search,
  Bell,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Trophy,
  ArrowDownRight,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatUGX, formatUGXPlain, timeAgo, TOKEN_BUY_RATE, TOKEN_REDEEM_RATE } from "@/lib/phrases";
import { Avatar } from "./avatar";
import { AddSpendingModal, type SpendingOwner } from "./modals";
import type { Child, ParentProfile } from "@/lib/types";

// ============================================================================
// 1. SEARCH OVERLAY — command palette
// ============================================================================

interface SearchResult {
  id: string;
  type: "child" | "parent" | "transaction" | "goal" | "spending";
  title: string;
  subtitle: string;
  icon: any;
  amount?: string;
  ownerColor?: string;
  ownerName?: string;
  ownerPhoto?: string;
}

export function SearchOverlay({
  onClose,
  onNavigateChild,
}: {
  onClose: () => void;
  onNavigateChild: (child: Child) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const children = useStore((s) => s.children);
  const parents = useStore((s) => s.parents);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const spending = useStore((s) => s.spending);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // Children
    for (const c of children) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.goalName.toLowerCase().includes(q) ||
        String(c.age).includes(q)
      ) {
        out.push({
          id: `child-${c.id}`,
          type: "child",
          title: c.name,
          subtitle: `Child · Age ${c.age} · Goal: ${c.goalName}`,
          icon: Trophy,
          amount: formatUGX(c.currentAmount),
          ownerColor: c.avatarColor,
          ownerName: c.name,
          ownerPhoto: c.avatarPhoto,
        });
      }
    }

    // Parents
    for (const p of parents) {
      if (p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)) {
        out.push({
          id: `parent-${p.id}`,
          type: "parent",
          title: p.name,
          subtitle: `${p.role}`,
          icon: Sparkles,
          ownerColor: p.avatarColor,
          ownerName: p.name,
          ownerPhoto: p.avatarPhoto,
        });
      }
    }

    // Goals
    for (const g of goals) {
      if (
        g.title.toLowerCase().includes(q) ||
        g.ownerName.toLowerCase().includes(q) ||
        (g.note ?? "").toLowerCase().includes(q)
      ) {
        out.push({
          id: `goal-${g.id}`,
          type: "goal",
          title: g.title,
          subtitle: `Goal · ${g.ownerName} · ${g.cadence} · ${g.visibility}`,
          icon: Target,
          amount: `${formatUGXPlain(g.currentAmount)} / ${formatUGXPlain(g.targetAmount)}`,
        });
      }
    }

    // Transactions (limit to 20 matches)
    let txCount = 0;
    for (const t of transactions) {
      if (txCount >= 20) break;
      const child = children.find((c) => c.id === t.childId);
      if (
        t.note.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (child?.name ?? "").toLowerCase().includes(q)
      ) {
        const credit = t.type === "save" || t.type === "redeem" || t.type === "parent_give";
        out.push({
          id: `tx-${t.id}`,
          type: "transaction",
          title: t.note,
          subtitle: `${child?.name ?? "—"} · ${t.type.replace("_", " ")} · ${timeAgo(t.timestamp)}`,
          icon: credit ? ArrowDownRight : ArrowUpRight,
          amount: t.amount > 0 ? `${credit ? "+" : "−"}${formatUGXPlain(t.amount)}` : undefined,
        });
        txCount++;
      }
    }

    // Spending (limit to 20 matches)
    let spCount = 0;
    for (const e of spending) {
      if (spCount >= 20) break;
      if (
        e.note.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.ownerName.toLowerCase().includes(q)
      ) {
        out.push({
          id: `spend-${e.id}`,
          type: "spending",
          title: e.note,
          subtitle: `${e.ownerName} · ${e.category} · ${timeAgo(e.timestamp)}`,
          icon: Wallet,
          amount: `−${formatUGXPlain(e.amount)}`,
        });
        spCount++;
      }
    }

    return out.slice(0, 30);
  }, [query, children, parents, transactions, goals, spending]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4 animate-fade-up"
      style={{
        background: "radial-gradient(80% 80% at 50% 0%, rgba(9,12,10,0.85) 0%, rgba(9,12,10,0.96) 100%)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="surface-wood-strong rounded-lg w-full max-w-2xl shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--hairline-strong)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="px-6 py-5 border-b border-[var(--hairline)] flex items-center gap-3">
          <Search className="h-4 w-4 text-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search children, goals, transactions, spending..."
            className="flex-1 bg-transparent border-0 outline-none text-base font-editorial tracking-wide"
            style={{ color: "var(--foreground)" }}
          />
          <button
            onClick={onClose}
            className="btn-ghost px-2 py-1 rounded text-xs tracking-wider"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="px-6 py-10 text-center text-foreground/40 text-sm">
              <Search className="h-6 w-6 mx-auto mb-3 opacity-40" />
              Start typing to search across the whole family ledger.
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {["Save", "Goal", "Tokens", "Invest", "Spending"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="btn-outline px-3 py-1 rounded text-xs tracking-wider"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-6 py-10 text-center text-foreground/40 text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-2">
              <div className="px-6 py-2 micro-label">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((r) => {
                const isChild = r.type === "child";
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (isChild) {
                        const child = children.find((c) => c.id === r.id.replace("child-", ""));
                        if (child) {
                          onNavigateChild(child);
                          onClose();
                        }
                      }
                    }}
                    className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] transition-colors text-left"
                  >
                    {/* Icon or avatar */}
                    {r.ownerColor ? (
                      <Avatar
                        name={r.ownerName ?? r.title}
                        color={r.ownerColor}
                        photo={r.ownerPhoto}
                        size={32}
                      />
                    ) : (
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "var(--surface-flat-bg)", border: "1px solid var(--hairline)" }}
                      >
                        <r.icon className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground tracking-wide truncate">{r.title}</div>
                      <div className="micro-label mt-0.5 truncate">{r.subtitle}</div>
                    </div>

                    {r.amount && (
                      <div
                        className="font-editorial text-sm tabular-nums shrink-0"
                        style={{ color: "var(--primary)" }}
                      >
                        {r.amount}
                      </div>
                    )}

                    {isChild && (
                      <ChevronRight className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--hairline)] flex justify-between items-center">
          <span className="micro-label">
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--surface-flat-bg)", border: "1px solid var(--hairline)" }}>ESC</kbd> to close
          </span>
          <span className="micro-label">Searches children · goals · transactions · spending</span>
        </div>
      </div>
    </div>
  );
}

// Need to import ChevronRight — add it here to keep the import block clean.
import { ChevronRight } from "lucide-react";

// ============================================================================
// 2. NOTIFICATIONS DROPDOWN — recent milestones derived from store
// ============================================================================

export function NotificationsButton({
  childList,
  parents,
}: {
  childList: Child[];
  parents: ParentProfile[];
}) {
  const children = childList;
  const [open, setOpen] = useState(false);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const tokenLedger = useStore((s) => s.tokenLedger);

  // Derive recent "notifications" — milestones from the last 30 days.
  const notifications = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 86_400_000;
    const out: {
      id: string;
      kind: "save" | "goal_progress" | "goal_reached" | "token" | "spend_alert";
      title: string;
      subtitle: string;
      timestamp: number;
      icon: any;
      tone: "good" | "neutral" | "warning";
    }[] = [];

    // Recent saves
    for (const t of transactions) {
      if (t.type === "save" && now - t.timestamp < thirtyDays) {
        const child = children.find((c) => c.id === t.childId);
        out.push({
          id: `tx-${t.id}`,
          kind: "save",
          title: `${child?.name ?? "Someone"} saved ${formatUGX(t.amount)}`,
          subtitle: t.note,
          timestamp: t.timestamp,
          icon: ArrowDownRight,
          tone: "good",
        });
      }
      if (t.type === "parent_give" && now - t.timestamp < thirtyDays) {
        const child = children.find((c) => c.id === t.childId);
        out.push({
          id: `tx-${t.id}`,
          kind: "token",
          title: `Awarded ${t.tokenDelta} tokens to ${child?.name ?? "child"}`,
          subtitle: t.note,
          timestamp: t.timestamp,
          icon: Sparkles,
          tone: "neutral",
        });
      }
    }

    // Goal progress milestones (>= 50%, >= 75%, 100%)
    for (const g of goals) {
      const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      if (pct >= 100) {
        out.push({
          id: `goal-reached-${g.id}`,
          kind: "goal_reached",
          title: `Goal reached: ${g.title}`,
          subtitle: `${g.ownerName} hit 100% of their target`,
          timestamp: g.createdAt + (g.targetAmount * 1000), // synthetic but stable
          icon: Trophy,
          tone: "good",
        });
      } else if (pct >= 75) {
        out.push({
          id: `goal-75-${g.id}`,
          kind: "goal_progress",
          title: `${g.ownerName} is 75% toward ${g.title}`,
          subtitle: `${formatUGX(g.currentAmount)} of ${formatUGX(g.targetAmount)}`,
          timestamp: g.createdAt,
          icon: Target,
          tone: "good",
        });
      } else if (pct >= 50) {
        out.push({
          id: `goal-50-${g.id}`,
          kind: "goal_progress",
          title: `${g.ownerName} is halfway to ${g.title}`,
          subtitle: `${formatUGX(g.currentAmount)} of ${formatUGX(g.targetAmount)}`,
          timestamp: g.createdAt,
          icon: Target,
          tone: "neutral",
        });
      }
    }

    // Sort by timestamp descending, take most recent 8
    return out.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, [transactions, goals, children]);

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost p-2 rounded relative"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-40 surface-wood-strong rounded-lg w-80 max-w-[calc(100vw-2rem)] shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center justify-between">
              <div>
                <div className="micro-label-gold mb-0.5">Notifications</div>
                <div className="font-editorial text-sm text-foreground tracking-wide">
                  Recent Activity
                </div>
              </div>
              <span className="micro-label">{notifications.length} items</span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-foreground/40 text-sm">
                  <Bell className="h-6 w-6 mx-auto mb-3 opacity-40" />
                  No recent activity to show.
                </div>
              ) : (
                notifications.map((n) => {
                  const toneColor =
                    n.tone === "good" ? "var(--chart-2)" : n.tone === "warning" ? "var(--chart-3)" : "var(--primary)";
                  return (
                    <div
                      key={n.id}
                      className="px-5 py-3 border-b border-[var(--hairline-soft)] flex items-start gap-3 last:border-b-0"
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `color-mix(in srgb, ${toneColor} 12%, transparent)` }}
                      >
                        <n.icon className="h-3.5 w-3.5" style={{ color: toneColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-foreground tracking-wide leading-snug">
                          {n.title}
                        </div>
                        <div className="micro-label mt-1 truncate">{n.subtitle}</div>
                        <div className="micro-label mt-0.5" style={{ opacity: 0.7 }}>
                          {timeAgo(n.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-[var(--hairline)] text-center">
              <span className="micro-label">
                Generated from last 30 days of family activity
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 3. LOG SPEND FAB — floating action button, always visible on parent dashboard
// ============================================================================

export function LogSpendFab({
  childList,
  parents,
}: {
  childList: Child[];
  parents: ParentProfile[];
}) {
  const children = childList;
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<SpendingOwner | null>(null);

  // Build the owner list: parents first, then children.
  const owners: SpendingOwner[] = useMemo(
    () => [
      ...parents.map((p) => ({ id: p.id, kind: "parent" as const, name: p.name })),
      ...children.map((c) => ({ id: c.id, kind: "child" as const, name: c.name })),
    ],
    [parents, children]
  );

  return (
    <>
      {/* FAB — bottom right, always visible */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {/* Owner picker — expands above the FAB */}
        {pickerOpen && (
          <div
            className="surface-wood-strong rounded-lg p-2 shadow-2xl min-w-[200px] animate-fade-up"
            style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--hairline-strong)" }}
          >
            <div className="px-3 py-2 micro-label-gold border-b border-[var(--hairline)] mb-1">
              Log spending for...
            </div>
            {owners.map((o) => {
              const parent = parents.find((p) => p.id === o.id);
              const child = children.find((c) => c.id === o.id);
              const color = parent?.avatarColor ?? child?.avatarColor ?? "#C9A84C";
              const photo = parent?.avatarPhoto ?? child?.avatarPhoto;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setSelectedOwner(o);
                    setPickerOpen(false);
                    setOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] transition-colors text-left"
                >
                  <Avatar name={o.name} color={color} photo={photo} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground tracking-wide truncate">{o.name}</div>
                    <div className="micro-label">{o.kind}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* The FAB itself */}
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="btn-gold h-14 w-14 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent), 0 0 0 1px var(--primary)",
          }}
          aria-label="Log Spend"
          title="Log spending for any family member"
        >
          {pickerOpen ? <X className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
        </button>
      </div>

      {/* Add Spending Modal */}
      {open && selectedOwner && (
        <AddSpendingModal
          owner={selectedOwner}
          onClose={() => {
            setOpen(false);
            setSelectedOwner(null);
          }}
        />
      )}
    </>
  );
}
