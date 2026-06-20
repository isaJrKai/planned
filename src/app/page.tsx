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

import { useMemo, useState } from "react";
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
  Calendar,
  Trophy,
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
import { GiveTokensModal } from "@/components/modals";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  SavingsTrendChart,
  DistributionDonut,
  CashFlowBars,
  GoalRadials,
} from "@/components/charts";
import type { Child } from "@/lib/types";
import { useShallow } from "zustand/react/shallow";

type Tab = "overview" | "children" | "transactions" | "investments" | "tokens" | "settings";

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  // Store only IDs — never the whole child object. Otherwise the saved
  // reference goes stale whenever the store updates the child's balance.
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [giveToChildId, setGiveToChildId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const childList = useStore((s) => s.children);
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
          fixed md:static z-40 w-64 shrink-0 border-r border-[rgba(201,168,76,0.10)] bg-[#0B0F0D]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-300 min-h-screen flex flex-col
        `}
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
                {tab === "settings" && "Settings"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost p-2 rounded" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
              <button className="btn-ghost p-2 rounded relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                <span
                  className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--primary)" }}
                />
              </button>
              <ThemeSwitcher />
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center font-editorial text-sm ml-1"
                style={{
                  background: "linear-gradient(135deg, var(--secondary), var(--card))",
                  border: "1px solid var(--hairline-strong)",
                  color: "var(--chart-5)",
                }}
              >
                M
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 md:px-10 py-8 max-w-7xl">
          {tab === "overview" && (
            <OverviewTab
              childList={children}
              onSelectChild={(c) => setActiveChildId(c.id)}
              onGiveTokens={(c) => setGiveToChildId(c.id)}
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
    </div>
  );
}

// ---- OVERVIEW TAB ----------------------------------------------------------
// QuickBooks-style: KPI cards row + Children table + Activity feed side panel.

function OverviewTab({
  childList,
  onSelectChild,
  onGiveTokens,
}: {
  childList: Child[];
  onSelectChild: (c: Child) => void;
  onGiveTokens: (c: Child) => void;
}) {
  const totalSavings = useStore(familyTotalSavings);
  const totalInvested = useStore(familyTotalInvested);
  const thisMonth = useStore(familyThisMonthSaved);
  const totalGoals = useStore(familyTotalGoals);
  const tokens = useStore(parentTokenBalance);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-lg p-6 ${k.hero ? "surface-wood-strong" : "surface-wood"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="micro-label">{k.label}</div>
              <k.icon className="h-3.5 w-3.5 text-[#C9A84C]" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <SavingsTrendChart />
        <DistributionDonut childList={children} />
        <CashFlowBars />
        <GoalRadials childList={children} />
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
                        <div
                          className="halo-glow h-8 w-8 rounded-full flex items-center justify-center font-editorial text-xs"
                          style={{
                            ["--halo-color" as any]: c.avatarColor,
                            background: c.avatarColor,
                            color: "#090C0A",
                          }}
                        >
                          {c.name.charAt(0)}
                        </div>
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

          <div className="px-6 py-4 border-t border-[rgba(201,168,76,0.06)] flex justify-between items-center">
            <span className="micro-label">Click a row to open the child dashboard</span>
            <button
              onClick={() => onGiveTokens(children[0])}
              className="btn-outline px-3 py-1.5 rounded text-xs tracking-wider flex items-center gap-2"
            >
              <Plus className="h-3 w-3" /> Award Tokens
            </button>
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
                          ? "rgba(107,191,138,0.10)"
                          : "rgba(212,148,58,0.10)",
                      }}
                    >
                      {credit ? (
                        <ArrowDownRight className="h-3 w-3 text-[#6BBF8A]" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 text-[#D4943A]" />
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
                        <div className="font-editorial tabular-nums text-sm text-[#E8D5A0]">
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
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {children.map((c) => {
          const pct = (c.currentAmount / c.goalAmount) * 100;
          return (
            <div
              key={c.id}
              className="surface-wood rounded-lg p-6 hover:border-[rgba(201,168,76,0.35)] transition-all cursor-pointer"
              onClick={() => onSelectChild(c)}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="halo-glow h-12 w-12 rounded-full flex items-center justify-center font-editorial"
                    style={{
                      ["--halo-color" as any]: c.avatarColor,
                      background: c.avatarColor,
                      color: "#090C0A",
                    }}
                  >
                    {c.name.charAt(0)}
                  </div>
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
                        <div
                          className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-editorial"
                          style={{
                            background: child?.avatarColor ?? "#666",
                            color: "#090C0A",
                          }}
                        >
                          {child?.name.charAt(0) ?? "?"}
                        </div>
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
                    <td className="text-right tabular-nums text-[#E8D5A0]">
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
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-editorial"
                        style={{ background: c.avatarColor, color: "#090C0A" }}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-foreground/80 text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-foreground/70">{given}</td>
                  <td className="text-right tabular-nums text-foreground/70">{redeemed}</td>
                  <td className="text-right tabular-nums font-editorial text-[#E8D5A0]">
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
                    className={`text-right tabular-nums font-editorial ${
                      t.type === "parent_give" ? "text-[#E8D5A0]" : "text-[#6BBF8A]"
                    }`}
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

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
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
          <span className="font-editorial text-lg text-[#6BBF8A] tabular-nums">
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
