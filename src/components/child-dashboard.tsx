"use client";

// ============================================================================
// CHILD DASHBOARD — Planned Kids Savings
// ============================================================================
// Per-child view with four tabs: Overview, Spending, Worksheet, Investments.
//
// Bugs addressed here:
//   #8  — Overview "This month" stat shows savings credits, not spending
//   #10 — Encouragement randomized per call (in phrases.ts)
//   #11 — Worksheet totalReceived filters to this month only
//   #12 — Spending entries surface immediately through getChildCategories
// ============================================================================

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Wallet,
  Plus,
  Trophy,
  Calendar,
  Target,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore, childTokenBalance, getChildCategories, childInvestments, childTransactions, childAccount, thisMonthSaved, totalInvested, childSpendingThisMonth } from "@/lib/store";
import {
  formatUGX,
  formatUGXPlain,
  getEncouragement,
  timeAgo,
  TOKEN_REDEEM_RATE,
} from "@/lib/phrases";
import type { Child } from "@/lib/types";
import {
  SaveMoneyModal,
  GiveTokensModal,
  AddSpendingModal,
  RedeemTokensModal,
  InvestmentDetailModal,
} from "./modals";
import { FamilyThemeFooter } from "./family-theme-footer";
import type { Investment } from "@/lib/types";

type Tab = "overview" | "spending" | "worksheet" | "investments";

export function ChildDashboard({
  child,
  onBack,
}: {
  child: Child;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [modal, setModal] = useState<null | "save" | "give" | "spend" | "redeem">(null);
  const [detailInvestment, setDetailInvestment] = useState<Investment | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "spending", label: "Spending" },
    { id: "worksheet", label: "Worksheet" },
    { id: "investments", label: "Investments" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-[rgba(201,168,76,0.10)] sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="btn-ghost px-3 py-2 rounded text-xs tracking-wider"
          >
            ← Family Overview
          </button>
          <div className="flex items-center gap-3">
            <div
              className="halo-glow h-9 w-9 rounded-full flex items-center justify-center font-editorial text-sm"
              style={{ ["--halo-color" as any]: child.avatarColor, background: child.avatarColor, color: "#090C0A" }}
            >
              {child.name.charAt(0)}
            </div>
            <div className="text-right">
              <div className="font-editorial text-sm tracking-wide text-foreground">{child.name}</div>
              <div className="micro-label">Age {child.age}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero balance */}
        <section className="mb-10 animate-fade-up">
          <div className="surface-wood-strong rounded-lg p-8 md:p-10 relative overflow-hidden">
            <div
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none animate-breathe"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="micro-label-gold mb-3">Current Savings</div>
              <div className="font-editorial text-5xl md:text-6xl text-gold-foil tabular-nums leading-none">
                {formatUGX(child.currentAmount)}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                <span className="micro-label">Goal: {child.goalName}</span>
                <span className="font-editorial tabular-nums text-foreground/70">
                  {formatUGX(child.goalAmount)}
                </span>
              </div>
              <div className="progress-thin mt-4 max-w-md">
                <div
                  style={{
                    width: `${Math.min(100, (child.currentAmount / child.goalAmount) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-foreground/50 tabular-nums">
                {((child.currentAmount / child.goalAmount) * 100).toFixed(1)}% to goal
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-[rgba(201,168,76,0.10)] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-xs tracking-wider transition-colors relative whitespace-nowrap ${
                tab === t.id
                  ? "text-[#E8D5A0]"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {t.label.toUpperCase()}
              {tab === t.id && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-px"
                  style={{
                    background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab child={child} onAction={setModal} />}
        {tab === "spending" && <SpendingTab child={child} onSpend={() => setModal("spend")} />}
        {tab === "worksheet" && <WorksheetTab child={child} />}
        {tab === "investments" && (
          <InvestmentsTab child={child} onSelect={setDetailInvestment} />
        )}
      </main>

      {/* Family theme footer — annual theme + monthly quote from parent */}
      <div className="max-w-6xl mx-auto px-6">
        <FamilyThemeFooter />
      </div>

      {/* Modals */}
      {modal === "save" && <SaveMoneyModal child={child} onClose={() => setModal(null)} />}
      {modal === "give" && <GiveTokensModal child={child} onClose={() => setModal(null)} />}
      {modal === "spend" && <AddSpendingModal child={child} onClose={() => setModal(null)} />}
      {modal === "redeem" && <RedeemTokensModal child={child} onClose={() => setModal(null)} />}
      {detailInvestment && (
        <InvestmentDetailModal
          investment={detailInvestment}
          onClose={() => setDetailInvestment(null)}
        />
      )}

      {/* Floating action button — quick actions */}
      <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={() => setModal("spend")}
          className="btn-outline px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2 shadow-lg"
        >
          <Plus className="h-3 w-3" /> Log Spend
        </button>
        <button
          onClick={() => setModal("save")}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2 shadow-lg"
        >
          <PiggyBank className="h-3 w-3" /> Save Money
        </button>
      </div>
    </div>
  );
}

// ---- Overview Tab ----------------------------------------------------------
// Bug #8 fix: "This Month" stat card shows THIS MONTH'S SAVINGS CREDITS,
// not totalSpent. The previous version conflated the two.

function OverviewTab({
  child,
  onAction,
}: {
  child: Child;
  onAction: (m: "save" | "give" | "spend" | "redeem") => void;
}) {
  const saved = useStore(thisMonthSaved(child.id));
  const invested = useStore(totalInvested(child.id));
  const tokens = useStore(childTokenBalance(child.id));
  const account = useStore(childAccount(child.id));
  // Raw state subscription, derive child's transactions in useMemo.
  const allTransactions = useStore((s) => s.transactions);
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.childId === child.id),
    [allTransactions, child.id]
  );

  const encouragement = useMemo(() => getEncouragement(), []);

  const stats = [
    {
      label: "This Month Saved",
      value: formatUGX(saved),
      icon: Calendar,
      tone: "gold" as const,
      sub: "credits to savings",
    },
    {
      label: "Total Investments",
      value: formatUGX(invested),
      icon: TrendingUp,
      tone: "green" as const,
      sub: "active positions",
    },
    {
      label: "Token Balance",
      value: `${tokens} ◈`,
      icon: Sparkles,
      tone: "gold" as const,
      sub: `≈ UGX ${tokens * TOKEN_REDEEM_RATE} if redeemed`,
    },
    {
      label: "Linked Account",
      value: account ? formatUGX(account.balance) : "—",
      icon: Wallet,
      tone: "amber" as const,
      sub: account?.name ?? "No linked account",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Encouragement */}
      <div className="surface-flat rounded-lg p-6 border-l-2 border-[#C9A84C]">
        <div className="micro-label-gold mb-2">Today's Note</div>
        <p className="font-editorial text-lg md:text-xl text-foreground/90 italic tracking-wide leading-relaxed">
          “{encouragement}”
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="surface-wood rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="micro-label">{s.label}</div>
              <s.icon
                className="h-3.5 w-3.5"
                style={{
                  color:
                    s.tone === "gold" ? "#C9A84C" : s.tone === "green" ? "#6BBF8A" : "#D4943A",
                }}
              />
            </div>
            <div className="font-editorial text-xl text-foreground tabular-nums leading-tight">
              {s.value}
            </div>
            <div className="text-[10px] text-foreground/45 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => onAction("save")}
          className="surface-wood rounded-lg p-4 text-left hover:border-[rgba(201,168,76,0.35)] transition-all group"
        >
          <PiggyBank className="h-4 w-4 text-[#C9A84C] mb-3" />
          <div className="font-editorial text-sm text-foreground tracking-wide">Save Money</div>
          <div className="micro-label mt-1">From linked account</div>
        </button>
        <button
          onClick={() => onAction("redeem")}
          className="surface-wood rounded-lg p-4 text-left hover:border-[rgba(201,168,76,0.35)] transition-all group"
        >
          <Sparkles className="h-4 w-4 text-[#E8D5A0] mb-3" />
          <div className="font-editorial text-sm text-foreground tracking-wide">Redeem Tokens</div>
          <div className="micro-label mt-1">Convert to savings</div>
        </button>
        <button
          onClick={() => onAction("spend")}
          className="surface-wood rounded-lg p-4 text-left hover:border-[rgba(201,168,76,0.35)] transition-all group"
        >
          <Wallet className="h-4 w-4 text-[#D4943A] mb-3" />
          <div className="font-editorial text-sm text-foreground tracking-wide">Log Spending</div>
          <div className="micro-label mt-1">Track a purchase</div>
        </button>
        <button
          onClick={() => onAction("give")}
          className="surface-wood rounded-lg p-4 text-left hover:border-[rgba(201,168,76,0.35)] transition-all group"
        >
          <Trophy className="h-4 w-4 text-[#6BBF8A] mb-3" />
          <div className="font-editorial text-sm text-foreground tracking-wide">View Tokens</div>
          <div className="micro-label mt-1">Parent awards</div>
        </button>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-editorial text-lg tracking-wide text-foreground">Recent Activity</h3>
          <span className="micro-label">{transactions.length} total</span>
        </div>
        <div className="surface-wood rounded-lg overflow-hidden">
          {transactions.slice(0, 6).map((t, i) => {
            const credit = t.type === "save" || t.type === "redeem" || t.type === "parent_give";
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i > 0 ? "border-t border-[rgba(201,168,76,0.06)]" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{
                      background: credit
                        ? "rgba(107,191,138,0.10)"
                        : "rgba(212,148,58,0.10)",
                    }}
                  >
                    {credit ? (
                      <ArrowDownRight className="h-3.5 w-3.5 text-[#6BBF8A]" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#D4943A]" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-foreground tracking-wide">{t.note}</div>
                    <div className="micro-label mt-0.5">
                      {t.type.replace("_", " ")} · {timeAgo(t.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Spending Tab ----------------------------------------------------------

function SpendingTab({ child, onSpend }: { child: Child; onSpend: () => void }) {
  // Subscribe to RAW state — never derive arrays in the selector (causes
  // infinite re-renders because each call produces new object references).
  const categories = useStore((s) => s.categories);
  const spending = useStore((s) => s.spending);

  // Derive per-child category breakdown with useMemo.
  const childCategories = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartTime = monthStart.getTime();

    return categories.map((category) => {
      const spent = spending
        .filter(
          (e) =>
            e.childId === child.id &&
            e.category === category.name &&
            e.timestamp >= monthStartTime
        )
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = Math.max(0, category.budget - spent);
      const pct = category.budget > 0 ? Math.min(100, (spent / category.budget) * 100) : 0;
      return { category, spent, remaining, pct };
    });
  }, [categories, spending, child.id]);

  const childSpending = useMemo(
    () =>
      spending
        .filter((e) => e.childId === child.id)
        .sort((a, b) => b.timestamp - a.timestamp),
    [spending, child.id]
  );

  const totalSpent = childSpending
    .filter((e) => new Date(e.timestamp).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBudget = childCategories.reduce((sum, c) => sum + c.category.budget, 0);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex items-end justify-between">
        <div>
          <div className="micro-label-gold mb-2">Monthly Budget</div>
          <div className="font-editorial text-3xl text-gold-foil-static tabular-nums">
            {formatUGX(totalSpent)}
          </div>
          <div className="micro-label mt-1">of {formatUGX(totalBudget)} allocated</div>
        </div>
        <button
          onClick={onSpend}
          className="btn-gold px-4 py-2 rounded text-xs tracking-wider flex items-center gap-2"
        >
          <Plus className="h-3 w-3" /> Log Spend
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {childCategories.map(({ category, spent, remaining, pct }) => (
          <div key={category.id} className="surface-wood rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-editorial text-sm tracking-wide text-foreground">
                {category.name}
              </div>
              <span className={`pill ${pct >= 100 ? "pill-amber" : pct >= 75 ? "pill-amber" : "pill-green"}`}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="progress-thin mb-3">
              <div style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <span className="micro-label">Spent</span>
              <span className="font-editorial tabular-nums text-foreground/80">
                {formatUGX(spent)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="micro-label">Remaining</span>
              <span
                className="font-editorial tabular-nums"
                style={{ color: remaining > 0 ? "#E8D5A0" : "#D4943A" }}
              >
                {formatUGX(remaining)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-editorial text-lg tracking-wide text-foreground mb-4">
          Spending Log
        </h3>
        <div className="surface-wood rounded-lg overflow-hidden">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {childSpending.slice(0, 15).map((e) => (
                <tr key={e.id}>
                  <td className="text-foreground/50 text-xs tabular-nums">
                    {new Date(e.timestamp).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="text-foreground/85">{e.category}</td>
                  <td className="text-foreground/60">{e.note}</td>
                  <td className="text-right font-editorial tabular-nums text-[#D4943A]">
                    −{formatUGXPlain(e.amount)}
                  </td>
                </tr>
              ))}
              {spending.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-foreground/40 py-8">
                    No spending logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Worksheet Tab ---------------------------------------------------------
// Bug #11 fix: totalReceived filters to THIS MONTH only — previously it summed
// all-time credits which made it mismatch totalSpent (which was month-only).

function WorksheetTab({ child }: { child: Child }) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Raw state subscriptions (avoid derived arrays in selectors).
  const allTransactions = useStore((s) => s.transactions);
  const allSpending = useStore((s) => s.spending);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const transactions = useMemo(
    () => allTransactions.filter((t) => t.childId === child.id),
    [allTransactions, child.id]
  );
  const spending = useMemo(
    () => allSpending.filter((e) => e.childId === child.id),
    [allSpending, child.id]
  );

  const receivedThisMonth = transactions
    .filter(
      (t) =>
        t.timestamp >= monthStart &&
        (t.type === "save" || t.type === "redeem")
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const spentThisMonth = spending
    .filter((e) => e.timestamp >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const net = receivedThisMonth - spentThisMonth;

  const rows = [
    { label: "Savings Deposits (this month)", value: receivedThisMonth, type: "credit" },
    { label: "Spending (this month)", value: spentThisMonth, type: "debit" },
    { label: "Net Cash Flow", value: net, type: net >= 0 ? "credit" : "debit" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <div className="micro-label-gold mb-2">Monthly Worksheet</div>
        <h2 className="font-editorial text-3xl text-foreground tracking-wide">
          {monthLabel}
        </h2>
      </div>

      <div className="surface-wood-strong rounded-lg p-6">
        <div className="micro-label mb-4">Cash Flow Summary</div>
        <div className="divider-gold mb-5" />
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <span className="text-sm text-foreground/70 tracking-wide">{r.label}</span>
              <span
                className="font-editorial text-xl tabular-nums"
                style={{
                  color:
                    r.type === "credit" ? "#6BBF8A" : "#D4943A",
                }}
              >
                {r.type === "credit" ? "+" : "−"}
                {formatUGXPlain(Math.abs(r.value))}
              </span>
            </div>
          ))}
        </div>
        <div className="divider-gold my-5" />
        <div className="flex items-center justify-between">
          <span className="micro-label-gold">Net Position</span>
          <span
            className="font-editorial text-2xl text-gold-foil-static tabular-nums"
          >
            {net >= 0 ? "+" : "−"}
            {formatUGXPlain(Math.abs(net))}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="surface-wood rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="micro-label-gold">Goal Progress</span>
          </div>
          <div className="font-editorial text-2xl tabular-nums text-foreground">
            {formatUGX(child.currentAmount)}
          </div>
          <div className="micro-label mt-1">of {formatUGX(child.goalAmount)}</div>
          <div className="progress-thin mt-3">
            <div
              style={{
                width: `${Math.min(100, (child.currentAmount / child.goalAmount) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="surface-wood rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="micro-label-gold">Daily Save Avg</span>
          </div>
          <div className="font-editorial text-2xl tabular-nums text-foreground">
            {formatUGX(receivedThisMonth / Math.max(1, now.getDate()))}
          </div>
          <div className="micro-label mt-1">this month, per day</div>
        </div>
      </div>
    </div>
  );
}

// ---- Investments Tab -------------------------------------------------------

function InvestmentsTab({
  child,
  onSelect,
}: {
  child: Child;
  onSelect: (i: Investment) => void;
}) {
  const allInvestments = useStore((s) => s.investments);
  const investments = useMemo(
    () => allInvestments.filter((i) => i.childId === child.id),
    [allInvestments, child.id]
  );
  const totalValue = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + i.currentValue, 0);
  const totalPrincipal = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + i.amountInvested, 0);
  const gain = totalValue - totalPrincipal;

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="surface-wood-strong rounded-lg p-6">
        <div className="micro-label-gold mb-2">Portfolio Value</div>
        <div className="font-editorial text-4xl text-gold-foil tabular-nums">
          {formatUGX(totalValue)}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="text-sm tabular-nums"
            style={{ color: gain >= 0 ? "#6BBF8A" : "#D4943A" }}
          >
            {gain >= 0 ? "+" : "−"}
            {formatUGXPlain(Math.abs(gain))}
          </span>
          <span className="micro-label">all-time gain</span>
        </div>
      </div>

      <div className="surface-wood rounded-lg overflow-hidden">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Type</th>
              <th className="text-right">Principal</th>
              <th className="text-right">Value</th>
              <th className="text-right">Gain</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => {
              const g = inv.currentValue - inv.amountInvested;
              const pct = inv.amountInvested > 0 ? (g / inv.amountInvested) * 100 : 0;
              return (
                <tr
                  key={inv.id}
                  onClick={() => onSelect(inv)}
                  className="cursor-pointer"
                >
                  <td className="font-editorial tracking-wide text-foreground">
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
                    {pct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
            {investments.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-foreground/40 py-8">
                  No investments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
