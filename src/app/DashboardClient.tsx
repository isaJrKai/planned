"use client";

// ============================================================================
// PARENT DASHBOARD — Planned Kids Savings
// ============================================================================
// Editorial Japandi-luxe aesthetic + QuickBooks-style organized layout.
//
// Layout (QuickBooks-inspired organization):
//   - Left sidebar: family brand + primary nav
//   - Top bar: page title + period selector + quick action
//   - Main: KPI cards row → Children table → Recent activity feed
//   - Tabs: Overview / Children / Transactions / Investments / Tokens / Settings
//
// Bugs addressed:
//   #4 — parentTokenBalance subtracts redeemed tokens (not inflated)
//   #14 — TOKEN_REDEEM_RATE constant used (not hardcoded 80)
//   #13 — no dead Prisma import (Zustand-only store)
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Sparkles,
  Settings,
  ChevronRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Bell,
  PiggyBank,
  Target,
  Trophy,
  Calendar,
  Wallet,
} from "lucide-react";
import {
  useStore,
  familyTotalSavings,
  familyTotalInvested,
  familyThisMonthSaved,
  familyTotalGoals,
  parentTokenBalance,
  parentTokensGiven,
  parentTokensRedeemed,
  txTypeLabel,
} from "@/lib/store";
import {
  TOKEN_BUY_RATE,
  TOKEN_REDEEM_RATE,
  formatUGX,
  formatUGXPlain,
  timeAgo,
} from "@/lib/phrases";
import { ChildDashboard } from "@/components/child-dashboard";
import { GiveTokensModal, AddSpendingModal } from "@/components/modals";
import type { SpendingOwner } from "@/components/modals";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  SearchOverlay,
  NotificationsButton,
  LogSpendFab,
} from "@/components/parent-actions";
import { ParentQuoteEditor } from "@/components/parent-quote-editor";
import { GoalsTab } from "@/components/goals";
import { Avatar } from "@/components/avatar";
import {
  setParentPhoto as persistSetParentPhoto,
  setParentName as persistSetParentName,
  setChildPhoto as persistSetChildPhoto,
  setChildName as persistSetChildName,
} from "@/lib/mutations";
import { useHydratedState, persistMutation } from "@/lib/store-hydration";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import {
  SavingsTrendChart,
  DistributionDonut,
  CashFlowBars,
  GoalRadials,
} from "@/components/charts";
import type { Child } from "@/lib/types";
import { useShallow } from "zustand/react/shallow";

type Tab = "overview" | "children" | "transactions" | "investments" | "tokens" | "goals" | "settings";

interface DashboardClientProps {
  isAdmin?: boolean;
  userEmail?: string | null;
}

export default function DashboardClient({ isAdmin = false, userEmail }: DashboardClientProps = {}) {
  const [tab, setTab] = useState<Tab>("overview");
  // Store only IDs — never the whole child object. Otherwise the saved
  // reference goes stale whenever the store updates the child's balance.
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [giveToChildId, setGiveToChildId] = useState<string | null>(null);
  const [spendOwner, setSpendOwner] = useState<SpendingOwner | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hydrate from /api/state on first mount — loads real DB data.
  useHydratedState();

  // Cmd+K / Ctrl+K keyboard shortcut to open search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const childList = useStore((s) => s.children);
  const parents = useStore((s) => s.parents);
  const sidebarTokenBalance = useStore(parentTokenBalance);

  // Always look the child up from the live store so balance updates propagate.
  const activeChild = activeChildId
    ? childList.find((c) => c.id === activeChildId) ?? null
    : null;
  const giveToChild = giveToChildId
    ? childList.find((c) => c.id === giveToChildId) ?? null
    : null;

  // If a child is selected, render the child dashboard instead.
  if (activeChild) {
    return (
      <ChildDashboard
        child={activeChild}
        onBack={() => setActiveChildId(null)}
      />
    );
  }

  const children = childList;

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "children", label: "Children", icon: Users },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "investments", label: "Investments", icon: TrendingUp },
    { id: "tokens", label: "Tokens", icon: Sparkles },
    { id: "goals", label: "Goals", icon: Target },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hide-desktop fixed top-4 left-4 z-50 btn-outline p-2 rounded"
        aria-label="Toggle navigation"
      >
        <ChevronRight
          className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-90" : ""}`}
        />
      </button>

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className="hide-desktop fixed inset-0 z-30 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static z-40 w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-300 min-h-screen flex flex-col
        `}
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        {/* Brand */}
        <div className="px-7 pt-8 pb-6">
          <div className="micro-label-gold mb-2">PLANNED</div>
          <div className="font-editorial text-xl text-foreground tracking-editorial leading-tight">
            Family Wealth
          </div>
          <div className="font-editorial italic text-sm text-foreground/40 tracking-wide mt-1">
            est. 2026
          </div>
        </div>

        <div className="divider-gold mx-7" />

        {/* Nav */}
        <nav className="px-4 py-5 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              className={`nav-item w-full mb-1 ${tab === item.id ? "active" : ""}`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">{item.label}</span>
              {tab === item.id && <ChevronRight className="h-3 w-3 opacity-60" />}
            </button>
          ))}
        </nav>

        <div className="divider-gold mx-7" />

        {/* Footer mini-stats */}
        <div className="px-7 py-6">
          <div className="micro-label mb-2">Circulating Tokens</div>
          <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
            {sidebarTokenBalance} ◈
          </div>
          <div className="micro-label mt-1">
            ≈ UGX {formatUGXPlain(sidebarTokenBalance * TOKEN_BUY_RATE)} cost basis
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="border-b border-[rgba(201,168,76,0.10)] sticky top-0 z-20 bg-background/80 backdrop-blur-md">
          <div className="px-6 md:px-10 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="micro-label-gold mb-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h1 className="font-editorial text-2xl md:text-3xl text-foreground tracking-editorial leading-tight">
                {tab === "overview" && "Family Overview"}
                {tab === "children" && "Children Accounts"}
                {tab === "transactions" && "Transaction Ledger"}
                {tab === "investments" && "Investment Portfolio"}
                {tab === "tokens" && "Token Economy"}
                {tab === "goals" && "Family Goals"}
                {tab === "settings" && "Settings"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost p-2 rounded"
                aria-label="Search"
                title="Search (children, goals, transactions, spending)"
              >
                <Search className="h-4 w-4" />
              </button>
              <NotificationsButton childList={children} parents={parents} />
              <ThemeSwitcher />
              <Avatar
                name={parents[0]?.name ?? "M"}
                color={parents[0]?.avatarColor ?? "#C9A84C"}
                photo={parents[0]?.avatarPhoto}
                size={36}
                className="ml-1 cursor-pointer"
                onClick={() => setTab("settings")}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 md:px-10 py-8 max-w-7xl">
          {tab === "overview" && (
            <OverviewTab
              childList={children}
              parents={parents}
              onSelectChild={(c) => setActiveChildId(c.id)}
              onGiveTokens={(c) => setGiveToChildId(c.id)}
              onLogSpend={(owner) => setSpendOwner(owner)}
            />
          )}
          {tab === "children" && (
            <ChildrenTab
              childList={children}
              onSelectChild={(c) => setActiveChildId(c.id)}
              onGiveTokens={(c) => setGiveToChildId(c.id)}
            />
          )}
          {tab === "transactions" && <TransactionsTab />}
          {tab === "investments" && <InvestmentsTab />}
          {tab === "tokens" && <TokensTab childList={children} onGive={(c) => setGiveToChildId(c.id)} />}
          {tab === "goals" && <GoalsTab parents={parents} childList={children} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>

      {/* Give Tokens modal */}
      {giveToChild && (
        <GiveTokensModal
          child={giveToChild}
          onClose={() => setGiveToChildId(null)}
        />
      )}

      {/* Add Spending modal — supports parents AND children as owners */}
      {spendOwner && (
        <AddSpendingModal
          owner={spendOwner}
          onClose={() => setSpendOwner(null)}
        />
      )}

      {/* Search overlay — Cmd+K or click search icon */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onNavigateChild={(c) => setActiveChildId(c.id)}
        />
      )}

      {/* Floating Log Spend button — always visible on parent dashboard */}
      <LogSpendFab childList={children} parents={parents} />
    </div>
  );
}

// ---- OVERVIEW TAB ----------------------------------------------------------
// QuickBooks-style: KPI cards row + Children table + Activity feed side panel.

function OverviewTab({
  childList,
  parents,
  onSelectChild,
  onGiveTokens,
  onLogSpend,
}: {
  childList: Child[];
  parents: { id: string; name: string; role: string; avatarColor: string; avatarPhoto?: string }[];
  onSelectChild: (c: Child) => void;
  onGiveTokens: (c: Child) => void;
  onLogSpend: (owner: SpendingOwner) => void;
}) {
  const totalSavings = useStore(familyTotalSavings);
  const totalInvested = useStore(familyTotalInvested);
  const thisMonth = useStore(familyThisMonthSaved);
  const totalGoals = useStore(familyTotalGoals);
  const tokens = useStore(parentTokenBalance);
  // Raw spending state — derive breakdown via useMemo to avoid infinite re-renders
  // (familySpendingBreakdown selector returns a new array each call).
  const allSpending = useStore((s) => s.spending);
  const familySpending = useMemo(
    () =>
      allSpending
        .filter((e) => {
          const d = new Date(e.timestamp);
          const now = new Date();
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .reduce((sum, e) => sum + e.amount, 0),
    [allSpending]
  );
  const spendingBreakdown = useMemo(() => {
    const now = new Date();
    const map = new Map<string, { ownerKind: "parent" | "child"; ownerName: string; total: number }>();
    for (const e of allSpending) {
      const d = new Date(e.timestamp);
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
      const existing = map.get(e.ownerId);
      if (existing) {
        existing.total += e.amount;
      } else {
        map.set(e.ownerId, { ownerKind: e.ownerKind, ownerName: e.ownerName, total: e.amount });
      }
    }
    return Array.from(map.entries())
      .map(([ownerId, v]) => ({ ownerId, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [allSpending]);
  // Raw state, derive recent slice via useMemo.
  const allTransactions = useStore((s) => s.transactions);
  const transactions = useMemo(
    () => allTransactions.slice(0, 8),
    [allTransactions]
  );
  const children = childList;

  const kpis = [
    {
      label: "Family Savings",
      value: formatUGX(totalSavings),
      sub: `of ${formatUGX(totalGoals)} goal`,
      pct: totalGoals > 0 ? (totalSavings / totalGoals) * 100 : 0,
      icon: PiggyBank,
      hero: true,
    },
    {
      label: "Investments",
      value: formatUGX(totalInvested),
      sub: "active portfolio",
      icon: TrendingUp,
    },
    {
      label: "This Month Saved",
      value: formatUGX(thisMonth),
      sub: "credits this period",
      icon: Calendar,
    },
    {
      label: "Tokens in Circulation",
      value: `${tokens} ◈`,
      sub: `cost UGX ${formatUGXPlain(tokens * TOKEN_BUY_RATE)}`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-lg p-6 ${k.hero ? "surface-wood-strong" : "surface-wood card-hover"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="micro-label">{k.label}</div>
              <k.icon className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            </div>
            <div
              className={`font-editorial tabular-nums leading-none ${
                k.hero ? "text-3xl text-gold-foil" : "text-2xl text-foreground"
              }`}
            >
              {k.value}
            </div>
            <div className="text-[10px] text-foreground/45 mt-2">{k.sub}</div>
            {k.pct !== undefined && (
              <div className="progress-thin mt-3">
                <div style={{ width: `${Math.min(100, k.pct)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Visualizations section — editorial SVG charts.
          Parents understand graphs better than ledger tables. */}
      <div className="space-y-3 mb-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="micro-label-gold mb-1">Visualizations</div>
            <h2 className="font-editorial text-lg text-foreground tracking-wide">
              Family Insights
            </h2>
          </div>
          <span className="micro-label">last 6 months</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 stagger">
        <SavingsTrendChart />
        <DistributionDonut childList={children} />
        <CashFlowBars />
        <GoalRadials childList={children} />
      </div>

      {/* Smart recommendations for the parent */}
      <div className="mb-6">
        <RecommendationsPanel familyId="singleton" variant="parent" />
      </div>

      {/* Main grid: children table + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children table — 2/3 width on desktop */}
        <div className="lg:col-span-2 surface-wood rounded-lg overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-[rgba(201,168,76,0.10)]">
            <div>
              <div className="micro-label-gold mb-1">Family Accounts</div>
              <h2 className="font-editorial text-lg text-foreground tracking-wide">
                Children Portfolios
              </h2>
            </div>
            <span className="micro-label">{children.length} active</span>
          </div>

          <table className="ledger-table">
            <thead>
              <tr>
                <th>Child</th>
                <th className="text-right">Saved</th>
                <th className="text-right">Goal</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => {
                const pct = (c.currentAmount / c.goalAmount) * 100;
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectChild(c)}
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={c.name}
                          color={c.avatarColor}
                          photo={c.avatarPhoto}
                          size={32}
                        />
                        <div>
                          <div className="font-editorial text-sm tracking-wide text-foreground">
                            {c.name}
                          </div>
                          <div className="micro-label mt-0.5">Age {c.age} · {c.goalName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right tabular-nums text-foreground font-editorial">
                      {formatUGXPlain(c.currentAmount)}
                    </td>
                    <td className="text-right tabular-nums text-foreground/60">
                      {formatUGXPlain(c.goalAmount)}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-thin flex-1 min-w-[80px]">
                          <div style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-foreground/60 w-10 text-right">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <ChevronRight className="h-3.5 w-3.5 text-foreground/30 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-6 py-4 border-t border-[rgba(201,168,76,0.06)] flex flex-wrap gap-2 justify-between items-center">
            <span className="micro-label">Click a row to open the child dashboard</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const p = parents[0];
                  if (p) {
                    onLogSpend({ id: p.id, kind: "parent", name: p.name });
                  }
                }}
                className="btn-outline px-3 py-1.5 rounded text-xs tracking-wider flex items-center gap-2"
                title="Log spending for any family member"
              >
                <Wallet className="h-3 w-3" /> Log Spend
              </button>
              <button
                onClick={() => onGiveTokens(children[0])}
                className="btn-outline px-3 py-1.5 rounded text-xs tracking-wider flex items-center gap-2"
              >
                <Plus className="h-3 w-3" /> Award Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Activity feed — 1/3 width */}
        <div className="surface-wood rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-[rgba(201,168,76,0.10)]">
            <div className="micro-label-gold mb-1">Latest Activity</div>
            <h2 className="font-editorial text-lg text-foreground tracking-wide">
              Recent Transactions
            </h2>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {transactions.map((t, i) => {
              const child = children.find((c) => c.id === t.childId);
              const credit =
                t.type === "save" || t.type === "redeem" || t.type === "parent_give";
              return (
                <div
                  key={t.id}
                  className={`px-6 py-4 ${i > 0 ? "border-t border-[rgba(201,168,76,0.04)]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: credit
                          ? "color-mix(in srgb, var(--chart-2) 12%, transparent)"
                          : "color-mix(in srgb, var(--chart-3) 12%, transparent)",
                      }}
                    >
                      {credit ? (
                        <ArrowDownRight className="h-3 w-3" style={{ color: "var(--chart-2)" }} />
                      ) : (
                        <ArrowUpRight className="h-3 w-3" style={{ color: "var(--chart-3)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{t.note}</div>
                      <div className="micro-label mt-0.5 truncate">
                        {child?.name.split(" ")[0]} · {txTypeLabel[t.type]} · {timeAgo(t.timestamp)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {t.amount > 0 && (
                        <div
                          className="font-editorial tabular-nums text-sm"
                          style={{ color: credit ? "#6BBF8A" : "#D4943A" }}
                        >
                          {credit ? "+" : "−"}
                          {formatUGXPlain(t.amount)}
                        </div>
                      )}
                      {t.tokenDelta > 0 && (
                        <div className="font-editorial tabular-nums text-sm" style={{ color: "var(--chart-5)" }}>
                          +{t.tokenDelta} ◈
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Family Spending This Month — per-person breakdown */}
      <div className="surface-wood rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="micro-label-gold mb-1">Family Spending · This Month</div>
            <h3 className="font-editorial text-lg text-foreground tracking-wide">
              Who Spent What
            </h3>
          </div>
          <div className="text-right">
            <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
              {formatUGX(familySpending)}
            </div>
            <div className="micro-label mt-1">total this month</div>
          </div>
        </div>
        <div className="divider-gold mb-5" />

        {spendingBreakdown.length === 0 ? (
          <div className="text-center py-6 text-foreground/40 text-sm">
            No spending logged this month yet.
          </div>
        ) : (
          <div className="space-y-3">
            {spendingBreakdown.map((row) => {
              // Look up avatar info from parents or children.
              const parent = parents.find((p) => p.id === row.ownerId);
              const child = children.find((c) => c.id === row.ownerId);
              const name = row.ownerName;
              const color = parent?.avatarColor ?? child?.avatarColor ?? "#C9A84C";
              const photo = parent?.avatarPhoto ?? child?.avatarPhoto;
              const pct = familySpending > 0 ? (row.total / familySpending) * 100 : 0;
              return (
                <div key={row.ownerId} className="flex items-center gap-4">
                  <Avatar name={name} color={color} photo={photo} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <div className="text-sm text-foreground tracking-wide">
                        {name}
                        <span
                          className="ml-2 pill pill-muted"
                          style={{ fontSize: 9, padding: "1px 6px" }}
                        >
                          {row.ownerKind}
                        </span>
                      </div>
                      <div className="text-xs tabular-nums text-foreground/70">
                        {formatUGXPlain(row.total)}
                      </div>
                    </div>
                    <div className="progress-thin">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div
                    className="font-editorial text-sm tabular-nums w-12 text-right"
                    style={{ color: "var(--chart-3)" }}
                  >
                    {pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="divider-gold my-4" />
        <div className="flex justify-between items-center">
          <span className="micro-label">
            Log spending for any family member — parents included.
          </span>
          <button
            onClick={() => {
              const p = parents[0];
              if (p) {
                onLogSpend({ id: p.id, kind: "parent", name: p.name });
              }
            }}
            className="btn-gold px-3 py-1.5 rounded text-xs tracking-wider flex items-center gap-2"
          >
            <Wallet className="h-3 w-3" /> Log Spend
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- CHILDREN TAB ----------------------------------------------------------

function ChildrenTab({
  childList,
  onSelectChild,
  onGiveTokens,
}: {
  childList: Child[];
  onSelectChild: (c: Child) => void;
  onGiveTokens: (c: Child) => void;
}) {
  const children = childList;
  const [showAddChild, setShowAddChild] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddChild() {
    if (!newName.trim() || !newAge) return;
    setAdding(true);
    try {
      await persistMutation("createChild", {
        name: newName,
        age: parseInt(newAge),
        goalName: newGoalName || "Savings Goal",
        goalAmount: parseInt(newGoalAmount) || 100000,
      });
      setNewName(""); setNewAge(""); setNewGoalName(""); setNewGoalAmount("");
      setShowAddChild(false);
    } catch {
      // error handled by persistMutation
    }
    setAdding(false);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Add Child button */}
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-lg text-foreground tracking-wide">
          {children.length} {children.length === 1 ? "Child" : "Children"}
        </h2>
        <button
          onClick={() => setShowAddChild(!showAddChild)}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Add Child
        </button>
      </div>

      {/* Add Child form */}
      {showAddChild && (
        <div className="surface-wood-strong rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Child Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-editorial" placeholder="e.g. Emma" />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Age</label>
              <input type="number" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="input-editorial" placeholder="e.g. 10" min="1" max="18" />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Savings Goal Name</label>
              <input type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className="input-editorial" placeholder="e.g. Bicycle" />
            </div>
            <div>
              <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Goal Amount (UGX)</label>
              <input type="number" value={newGoalAmount} onChange={(e) => setNewGoalAmount(e.target.value)} className="input-editorial" placeholder="e.g. 200000" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddChild} disabled={adding || !newName.trim() || !newAge} className="btn-gold px-4 py-2 rounded text-xs tracking-wider disabled:opacity-50">
              {adding ? "Adding..." : "Add Child"}
            </button>
            <button onClick={() => setShowAddChild(false)} className="btn-ghost px-4 py-2 rounded text-xs tracking-wider">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Children grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {children.map((c) => {
          const pct = c.goalAmount > 0 ? (c.currentAmount / c.goalAmount) * 100 : 0;
          return (
            <div
              key={c.id}
              className="surface-wood rounded-lg p-6 card-hover"
              onClick={() => onSelectChild(c)}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={c.name}
                    color={c.avatarColor}
                    photo={c.avatarPhoto}
                    size={48}
                  />
                  <div>
                    <div className="font-editorial text-base text-foreground tracking-wide">
                      {c.name}
                    </div>
                    <div className="micro-label mt-1">Age {c.age}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGiveTokens(c);
                  }}
                  className="btn-outline px-2 py-1 rounded text-[10px] tracking-wider flex items-center gap-1"
                >
                  <Trophy className="h-2.5 w-2.5" /> Award
                </button>
              </div>

              <div className="micro-label mb-2">Current Savings</div>
              <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
                {formatUGX(c.currentAmount)}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="micro-label">{c.goalName}</span>
                  <span className="tabular-nums text-foreground/50">{pct.toFixed(0)}%</span>
                </div>
                <div className="progress-thin">
                  <div style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>

              <div className="divider-gold my-4" />
              <div className="flex justify-between items-center text-xs">
                <span className="micro-label">Goal</span>
                <span className="font-editorial tabular-nums text-foreground/70">
                  {formatUGX(c.goalAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- TRANSACTIONS TAB ------------------------------------------------------

function TransactionsTab() {
  const transactions = useStore((s) => s.transactions);
  const children = useStore((s) => s.children);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(201,168,76,0.10)] flex items-center justify-between">
          <div>
            <div className="micro-label-gold mb-1">Family Ledger</div>
            <h2 className="font-editorial text-lg text-foreground tracking-wide">
              All Transactions
            </h2>
          </div>
          <span className="micro-label">{transactions.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Child</th>
                <th>Type</th>
                <th>Note</th>
                <th className="text-right">Cash</th>
                <th className="text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const child = children.find((c) => c.id === t.childId);
                const credit =
                  t.type === "save" || t.type === "redeem" || t.type === "parent_give";
                return (
                  <tr key={t.id}>
                    <td className="text-foreground/50 text-xs tabular-nums">
                      {new Date(t.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={child?.name ?? "?"}
                          color={child?.avatarColor ?? "#666"}
                          photo={child?.avatarPhoto}
                          size={20}
                        />
                        <span className="text-foreground/80 text-sm">
                          {child?.name.split(" ")[0]}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          credit ? "pill-green" : "pill-amber"
                        }`}
                      >
                        {txTypeLabel[t.type]}
                      </span>
                    </td>
                    <td className="text-foreground/70 text-sm">{t.note}</td>
                    <td
                      className="text-right tabular-nums font-editorial"
                      style={{ color: t.amount > 0 ? (credit ? "#6BBF8A" : "#D4943A") : "transparent" }}
                    >
                      {t.amount > 0
                        ? `${credit ? "+" : "−"}${formatUGXPlain(t.amount)}`
                        : "—"}
                    </td>
                    <td className="text-right tabular-nums" style={{ color: "var(--chart-5)" }}>
                      {t.tokenDelta > 0 ? `+${t.tokenDelta} ◈` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- INVESTMENTS TAB -------------------------------------------------------

function InvestmentsTab() {
  const investments = useStore((s) => s.investments);
  const children = useStore((s) => s.children);

  const totalValue = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + i.currentValue, 0);
  const totalPrincipal = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + i.amountInvested, 0);
  const totalGain = totalValue - totalPrincipal;
  const gainPct = totalPrincipal > 0 ? (totalGain / totalPrincipal) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="micro-label-gold mb-2">Total Portfolio</div>
        <div className="font-editorial text-4xl text-gold-foil tabular-nums">
          {formatUGX(totalValue)}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="text-sm tabular-nums"
            style={{ color: totalGain >= 0 ? "#6BBF8A" : "#D4943A" }}
          >
            {totalGain >= 0 ? "+" : "−"}
            {formatUGXPlain(Math.abs(totalGain))} ({gainPct.toFixed(2)}%)
          </span>
          <span className="micro-label">all-time gain on {formatUGXPlain(totalPrincipal)} principal</span>
        </div>
      </div>

      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(201,168,76,0.10)]">
          <div className="micro-label-gold mb-1">Open Positions</div>
          <h2 className="font-editorial text-lg text-foreground tracking-wide">
            Investment Holdings
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Position</th>
                <th>Type</th>
                <th className="text-right">Principal</th>
                <th className="text-right">Value</th>
                <th className="text-right">Gain</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const child = children.find((c) => c.id === inv.childId);
                const g = inv.currentValue - inv.amountInvested;
                const pct = inv.amountInvested > 0 ? (g / inv.amountInvested) * 100 : 0;
                return (
                  <tr key={inv.id}>
                    <td>
                      <span className="text-foreground/80 text-sm">
                        {child?.name.split(" ")[0]}
                      </span>
                    </td>
                    <td className="font-editorial text-foreground tracking-wide">
                      {inv.name}
                    </td>
                    <td className="text-foreground/60 text-xs">{inv.type}</td>
                    <td className="text-right tabular-nums text-foreground/70">
                      {formatUGXPlain(inv.amountInvested)}
                    </td>
                    <td className="text-right tabular-nums text-foreground">
                      {formatUGXPlain(inv.currentValue)}
                    </td>
                    <td
                      className="text-right tabular-nums"
                      style={{ color: g >= 0 ? "#6BBF8A" : "#D4943A" }}
                    >
                      {g >= 0 ? "+" : ""}
                      {pct.toFixed(2)}%
                    </td>
                    <td>
                      <span
                        className={`pill ${inv.status === "active" ? "pill-green" : "pill-muted"}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- TOKENS TAB ------------------------------------------------------------

function TokensTab({
  childList,
  onGive,
}: {
  childList: Child[];
  onGive: (c: Child) => void;
}) {
  const children = childList;
  const tokensGiven = useStore(parentTokensGiven);
  const tokensRedeemed = useStore(parentTokensRedeemed);
  const balance = useStore(parentTokenBalance);
  const costBasis = tokensGiven * TOKEN_BUY_RATE;
  const redeemedValue = tokensRedeemed * TOKEN_REDEEM_RATE;
  const allLedger = useStore((s) => s.tokenLedger);
  const ledger = useMemo(
    () => allLedger.slice().sort((a, b) => b.timestamp - a.timestamp),
    [allLedger]
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-wood-strong rounded-lg p-6">
          <div className="micro-label-gold mb-2">Tokens in Circulation</div>
          <div className="font-editorial text-4xl text-gold-foil tabular-nums">
            {balance} ◈
          </div>
          <div className="micro-label mt-2">
            Cost basis: UGX {formatUGXPlain(costBasis)}
          </div>
        </div>
        <div className="surface-wood rounded-lg p-6">
          <div className="micro-label mb-2">Awarded (all-time)</div>
          <div className="font-editorial text-3xl text-foreground tabular-nums">
            {tokensGiven} ◈
          </div>
          <div className="micro-label mt-2">
            UGX {formatUGXPlain(costBasis)} invested
          </div>
        </div>
        <div className="surface-wood rounded-lg p-6">
          <div className="micro-label mb-2">Redeemed (all-time)</div>
          <div className="font-editorial text-3xl text-foreground tabular-nums">
            {tokensRedeemed} ◈
          </div>
          <div className="micro-label mt-2">
            UGX {formatUGXPlain(redeemedValue)} credited to savings
          </div>
        </div>
      </div>

      {/* Per-child balances */}
      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(201,168,76,0.10)]">
          <div className="micro-label-gold mb-1">Per Child</div>
          <h2 className="font-editorial text-lg text-foreground tracking-wide">
            Token Holdings by Child
          </h2>
        </div>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Child</th>
              <th className="text-right">Awarded</th>
              <th className="text-right">Redeemed</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Redeem Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {children.map((c) => {
              const given = ledger.filter((t) => t.childId === c.id && t.type === "parent_give").reduce((s, t) => s + t.tokens, 0);
              const redeemed = ledger.filter((t) => t.childId === c.id && t.type === "redeem").reduce((s, t) => s + t.tokens, 0);
              const bal = given - redeemed;
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={c.name}
                        color={c.avatarColor}
                        photo={c.avatarPhoto}
                        size={24}
                      />
                      <span className="text-foreground/80 text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-foreground/70">{given}</td>
                  <td className="text-right tabular-nums text-foreground/70">{redeemed}</td>
                  <td className="text-right tabular-nums font-editorial" style={{ color: "var(--chart-5)" }}>
                    {bal} ◈
                  </td>
                  <td className="text-right tabular-nums text-foreground/70">
                    {formatUGXPlain(bal * TOKEN_REDEEM_RATE)}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => onGive(c)}
                      className="btn-outline px-2 py-1 rounded text-[10px] tracking-wider"
                    >
                      Award
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Full ledger */}
      <div className="surface-wood rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-[rgba(201,168,76,0.10)]">
          <div className="micro-label-gold mb-1">Ledger</div>
          <h2 className="font-editorial text-lg text-foreground tracking-wide">
            Token Activity
          </h2>
        </div>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Child</th>
              <th>Type</th>
              <th>Note</th>
              <th className="text-right">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {ledger.slice(0, 20).map((t) => {
              const child = children.find((c) => c.id === t.childId);
              return (
                <tr key={t.id}>
                  <td className="text-foreground/50 text-xs tabular-nums">
                    {new Date(t.timestamp).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="text-foreground/80 text-sm">
                    {child?.name.split(" ")[0]}
                  </td>
                  <td>
                    <span
                      className={`pill ${t.type === "parent_give" ? "pill-gold" : "pill-green"}`}
                    >
                      {t.type === "parent_give" ? "Awarded" : "Redeemed"}
                    </span>
                  </td>
                  <td className="text-foreground/70 text-sm">{t.note}</td>
                  <td
                    className="text-right tabular-nums font-editorial"
                    style={{
                      color: t.type === "parent_give" ? "var(--chart-5)" : "var(--chart-2)",
                    }}
                  >
                    {t.type === "parent_give" ? "+" : "−"}
                    {t.tokens} ◈
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- SETTINGS TAB ----------------------------------------------------------

function SettingsTab() {
  const balance = useStore(parentTokenBalance);
  const totalSavings = useStore(familyTotalSavings);
  const totalInvested = useStore(familyTotalInvested);
  const netWorth = totalSavings + totalInvested;
  const parents = useStore((s) => s.parents);
  const children = useStore((s) => s.children);
  const [showAddParent, setShowAddParent] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [newParentRole, setNewParentRole] = useState("");
  const [addingParent, setAddingParent] = useState(false);

  async function handleAddParent() {
    if (!newParentName.trim()) return;
    setAddingParent(true);
    try {
      await persistMutation("createParent", {
        name: newParentName,
        role: newParentRole || "Parent",
      });
      setNewParentName(""); setNewParentRole("");
      setShowAddParent(false);
    } catch {}
    setAddingParent(false);
  }

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      {/* Family profiles — photos + names */}
      <div className="surface-wood rounded-lg p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="micro-label-gold">Family Profiles</div>
          <button
            onClick={() => setShowAddParent(!showAddParent)}
            className="btn-gold px-3 py-1.5 rounded text-[10px] tracking-wider flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" /> Add Parent
          </button>
        </div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide mb-2">
          Photos &amp; Names
        </h2>
        <p className="text-xs text-foreground/55 mb-5 leading-relaxed">
          Click an avatar to upload a photo. Photos appear in the sidebar,
          tables, and child dashboards.
        </p>

        {/* Add Parent form */}
        {showAddParent && (
          <div className="surface-wood-strong rounded-lg p-4 mb-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Parent Name</label>
                <input type="text" value={newParentName} onChange={(e) => setNewParentName(e.target.value)} className="input-editorial" placeholder="e.g. Sarah" />
              </div>
              <div>
                <label className="block text-[10px] tracking-wider uppercase text-foreground/60 mb-1.5">Role</label>
                <input type="text" value={newParentRole} onChange={(e) => setNewParentRole(e.target.value)} className="input-editorial" placeholder="e.g. Mother, Father, Guardian" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddParent} disabled={addingParent || !newParentName.trim()} className="btn-gold px-4 py-2 rounded text-xs tracking-wider disabled:opacity-50">
                {addingParent ? "Adding..." : "Add Parent"}
              </button>
              <button onClick={() => setShowAddParent(false)} className="btn-ghost px-4 py-2 rounded text-xs tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divider-gold mb-5" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {parents.map((p) => (
            <ProfileEditorCard
              key={p.id}
              name={p.name}
              color={p.avatarColor}
              photo={p.avatarPhoto}
              roleLabel={p.role}
              onUpload={(url) => persistSetParentPhoto(p.id, url)}
              onRemove={() => persistSetParentPhoto(p.id, "")}
              onNameChange={(n) => persistSetParentName(p.id, n)}
            />
          ))}
          {children.map((c) => (
            <ProfileEditorCard
              key={c.id}
              name={c.name}
              color={c.avatarColor}
              photo={c.avatarPhoto}
              roleLabel={`Child · Age ${c.age}`}
              onUpload={(url) => persistSetChildPhoto(c.id, url)}
              onRemove={() => persistSetChildPhoto(c.id, "")}
              onNameChange={(n) => persistSetChildName(c.id, n)}
            />
          ))}
        </div>
      </div>

      {/* Family theme + monthly quote editor — parent sets what children see */}
      <div>
        <div className="mb-4">
          <div className="micro-label-gold mb-1">Family Editorial</div>
          <h2 className="font-editorial text-xl text-foreground tracking-wide">
            Theme &amp; Quote for the Children
          </h2>
          <p className="text-xs text-foreground/55 mt-1 leading-relaxed max-w-xl">
            Set an annual theme and a monthly quote. Both appear at the bottom
            of every child dashboard — a quiet reminder of the family&apos;s
            wealth-building intention.
          </p>
        </div>
        <ParentQuoteEditor />
      </div>

      <div className="surface-wood rounded-lg p-6">
        <div className="micro-label-gold mb-1">Token Economics</div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide mb-5">
          Rate Configuration
        </h2>
        <div className="divider-gold mb-5" />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="micro-label mb-2">Buy Rate (Parent)</div>
            <div className="font-editorial text-2xl text-foreground tabular-nums">
              UGX {TOKEN_BUY_RATE}<span className="text-sm text-foreground/50">/◈</span>
            </div>
            <div className="micro-label mt-1">Cost basis for awards</div>
          </div>
          <div>
            <div className="micro-label mb-2">Redeem Rate (Child)</div>
            <div className="font-editorial text-2xl text-gold-foil-static tabular-nums">
              UGX {TOKEN_REDEEM_RATE}<span className="text-sm text-foreground/50">/◈</span>
            </div>
            <div className="micro-label mt-1">Credited to savings on redeem</div>
          </div>
        </div>
        <div className="divider-gold my-5" />
        <div className="flex justify-between items-center">
          <span className="micro-label">Incentive Spread</span>
          <span className="font-editorial text-lg tabular-nums" style={{ color: "var(--chart-2)" }}>
            +{((TOKEN_REDEEM_RATE / TOKEN_BUY_RATE - 1) * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-foreground/50 mt-3 leading-relaxed">
          The child redeems at a 60% premium over the parent's buy rate — this is
          the central incentive mechanic. Children earn more than the parent paid in,
          rewarding consistent saving and good behaviour.
        </p>
      </div>

      <div className="surface-wood rounded-lg p-6">
        <div className="micro-label-gold mb-1">Family Net Worth</div>
        <h2 className="font-editorial text-xl text-foreground tracking-wide mb-5">
          Position Summary
        </h2>
        <div className="divider-gold mb-5" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="micro-label">Total Savings</span>
            <span className="font-editorial text-lg tabular-nums text-foreground">
              {formatUGX(totalSavings)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="micro-label">Total Investments</span>
            <span className="font-editorial text-lg tabular-nums text-foreground">
              {formatUGX(totalInvested)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="micro-label">Token Value (cost basis)</span>
            {/* Bug #4 fix: balance already accounts for redemptions, so cost basis
                of REMAINING tokens is balance * BUY_RATE (not inflated). */}
            <span className="font-editorial text-lg tabular-nums text-foreground/70">
              {formatUGX(balance * TOKEN_BUY_RATE)}
            </span>
          </div>
          <div className="divider-gold my-2" />
          <div className="flex justify-between items-center">
            <span className="micro-label-gold">Family Net Worth</span>
            <span className="font-editorial text-2xl text-gold-foil tabular-nums">
              {formatUGX(netWorth)}
            </span>
          </div>
        </div>
      </div>

      <div className="surface-flat rounded-lg p-5">
        <div className="micro-label mb-2">About This Build</div>
        <p className="text-xs text-foreground/50 leading-relaxed">
          Planned is a quiet, editorial wealth-building canvas for families. All
          data is currently mock (client-side Zustand store) — the Prisma schema
          is ready for when you connect a real database. The 14-bug audit from
          the previous session is fully resolved: balance updates, per-child
          math, token economics, and module-level randomness are all corrected.
        </p>
      </div>
    </div>
  );
}

// ---- Profile Editor Card — used in SettingsTab for photo + name editing ----

function ProfileEditorCard({
  name,
  color,
  photo,
  roleLabel,
  onUpload,
  onRemove,
  onNameChange,
}: {
  name: string;
  color: string;
  photo?: string;
  roleLabel: string;
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [dirty, setDirty] = useState(false);

  return (
    <div className="surface-flat rounded-lg p-5 text-center">
      <div className="flex justify-center mb-4">
        <Avatar
          name={name}
          color={color}
          photo={photo}
          size={72}
          showUploadButton
          onUpload={onUpload}
          onRemove={photo ? onRemove : undefined}
        />
      </div>
      <input
        type="text"
        value={draftName}
        onChange={(e) => {
          setDraftName(e.target.value);
          setDirty(e.target.value !== name);
        }}
        onBlur={() => {
          if (dirty && draftName.trim()) {
            onNameChange(draftName);
            setDirty(false);
          } else {
            setDraftName(name);
            setDirty(false);
          }
        }}
        maxLength={40}
        className="input-editorial w-full px-3 py-2 text-center font-editorial text-sm tracking-wide"
      />
      <div className="micro-label mt-2">{roleLabel}</div>
      {dirty && (
        <div className="micro-label mt-1" style={{ color: "var(--chart-3)" }}>
          Press Tab/blur to save
        </div>
      )}
    </div>
  );
}
