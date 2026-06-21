"use client";

// ============================================================================
// CHARTS — Editorial SVG Visualizations for Parent Overview
// ============================================================================
// Custom SVG charts in the editorial luxe aesthetic. No external charting
// library — full control over gold foil strokes, Playfair labels, and
// hairline gridlines. Theme-aware via CSS variables (currentColor + var()).
//
// Charts:
//   1. SavingsTrendChart   — line chart, 6-month savings trajectory
//   2. DistributionDonut   — donut chart, per-child share of total savings
//   3. CashFlowBars        — bar chart, savings vs spending per month
//   4. GoalRadials         — radial progress for each child's goal
// ============================================================================

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatUGXPlain } from "@/lib/phrases";
import type { Child } from "@/lib/types";

// ---- Shared helpers --------------------------------------------------------

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function last6MonthLabels(now = new Date()): { label: string; year: number; month: number }[] {
  const out: { label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: MONTHS_SHORT[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return out;
}

// ============================================================================
// 1. SAVINGS TREND — line chart, 6-month savings trajectory
// ============================================================================

export function SavingsTrendChart() {
  const transactions = useStore((s) => s.transactions);

  const months = useMemo(() => last6MonthLabels(), []);
  const now = new Date();

  // Compute cumulative savings per month (starting from 6 months ago).
  // We use ALL transactions up to the end of each month as the cumulative
  // savings balance at that point — synthesized from save/redeem credits
  // and invest/withdraw debits.
  const data = useMemo(() => {
    const startOfWindow = new Date(months[0].year, months[0].month, 1).getTime();
    const endOfWindow = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    // All transactions before end-of-window affect the cumulative balance.
    const relevant = transactions.filter((t) => t.timestamp <= endOfWindow);

    // Compute baseline = balance at start of window
    const beforeWindow = relevant.filter((t) => t.timestamp < startOfWindow);
    let baseline = 0;
    for (const t of beforeWindow) {
      if (t.type === "save" || t.type === "redeem") baseline += t.amount;
      else if (t.type === "invest" || t.type === "withdraw") baseline -= t.amount;
    }

    // Compute cumulative at end of each month
    const points: { label: string; value: number }[] = [];
    let cumulative = baseline;
    for (const m of months) {
      const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59).getTime();
      const inMonth = relevant.filter(
        (t) =>
          t.timestamp >= new Date(m.year, m.month, 1).getTime() &&
          t.timestamp <= endOfMonth
      );
      let monthDelta = 0;
      for (const t of inMonth) {
        if (t.type === "save" || t.type === "redeem") monthDelta += t.amount;
        else if (t.type === "invest" || t.type === "withdraw") monthDelta -= t.amount;
      }
      cumulative += monthDelta;
      // For past months, use actual cumulative; for current month, also use cumulative
      points.push({ label: m.label, value: Math.max(0, cumulative) });
    }
    return points;
  }, [transactions, months, now]);

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;

  // SVG layout
  const W = 480;
  const H = 200;
  const padX = 36;
  const padY = 28;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const xFor = (i: number) => padX + (chartW * i) / (data.length - 1);
  const yFor = (v: number) => padY + chartH - ((v - min) / range) * chartH;

  // Build smooth path
  const linePath = data
    .map((d, i) => {
      const x = xFor(i);
      const y = yFor(d.value);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = xFor(i - 1);
      const prevY = yFor(data[i - 1].value);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;
      return `C ${cpX1} ${prevY} ${cpX2} ${y} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${padY + chartH} L ${xFor(0)} ${padY + chartH} Z`;

  // Gridlines (3 horizontal)
  const gridLines = [0, 0.5, 1].map((p) => padY + chartH - p * chartH);

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1">6-Month Trajectory</div>
          <h3 className="font-editorial text-base text-foreground tracking-wide">
            Savings Trend
          </h3>
        </div>
        <div className="text-right">
          <div className="font-editorial text-lg text-gold-foil-static tabular-nums">
            {formatUGXPlain(data[data.length - 1]?.value ?? 0)}
          </div>
          <div className="micro-label">current balance</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="50%" stopColor="var(--chart-5)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            y1={y}
            x2={W - padX}
            y2={y}
            stroke="var(--hairline)"
            strokeWidth="1"
            strokeDasharray={i === gridLines.length - 1 ? "" : "2 4"}
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#trend-area)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#trend-line)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={xFor(i)}
              cy={yFor(d.value)}
              r="3"
              fill="var(--background)"
              stroke="var(--primary)"
              strokeWidth="1.5"
            />
            <text
              x={xFor(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-faint)"
              letterSpacing="1.5"
              fontFamily="var(--font-sans)"
            >
              {d.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// 2. DISTRIBUTION DONUT — per-child share of total savings
// ============================================================================

export function DistributionDonut({ childList }: { childList: Child[] }) {
  const total = childList.reduce((sum, c) => sum + c.currentAmount, 0);

  // Compute donut segments
  const R = 70;
  const r = 50;
  const cx = 100;
  const cy = 100;
  const C = 2 * Math.PI * R;

  // Compute donut segments using reduce so we never reassign during render.
  const colors = ["var(--primary)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
  const segments = childList.reduce<
    { path: string; color: string; pct: number; child: Child; cumulativeAngle: number }[]
  >((acc, c, i) => {
    const pct = total > 0 ? c.currentAmount / total : 0;
    const angle = pct * 360;
    const startAngle = acc.length > 0 ? acc[acc.length - 1].cumulativeAngle : 0;
    const endAngle = startAngle + angle;

    // Convert to SVG arc path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + R * Math.cos(startRad);
    const y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(endRad);
    const y2 = cy + R * Math.sin(endRad);

    const x1i = cx + r * Math.cos(startRad);
    const y1i = cy + r * Math.sin(startRad);
    const x2i = cx + r * Math.cos(endRad);
    const y2i = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x2i} ${y2i} A ${r} ${r} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;

    return [
      ...acc,
      { path, color: colors[i % colors.length], pct, child: c, cumulativeAngle: endAngle },
    ];
  }, []);

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1">Per Child</div>
          <h3 className="font-editorial text-base text-foreground tracking-wide">
            Distribution
          </h3>
        </div>
        <span className="micro-label">{childList.length} accounts</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 200 200" className="w-32 h-32">
            {total === 0 ? (
              <circle cx={100} cy={100} r={70} fill="none" stroke="var(--hairline)" strokeWidth="20" />
            ) : (
              segments.map((s, i) => (
                <path
                  key={i}
                  d={s.path}
                  fill={s.color}
                  opacity={0.9}
                  stroke="var(--background)"
                  strokeWidth="1"
                />
              ))
            )}
            {/* Center label */}
            <text
              x={100}
              y={92}
              textAnchor="middle"
              fontSize="8"
              letterSpacing="2"
              fill="var(--micro-label)"
              fontFamily="var(--font-sans)"
            >
              TOTAL
            </text>
            <text
              x={100}
              y={110}
              textAnchor="middle"
              fontSize="14"
              fill="var(--primary)"
              fontFamily="var(--font-playfair)"
              fontWeight="600"
            >
              {formatUGXPlain(total)}
            </text>
          </svg>
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-xs text-foreground/80 truncate flex-1">
                {s.child.name.split(" ")[0]}
              </span>
              <span
                className="font-editorial text-xs tabular-nums shrink-0"
                style={{ color: "var(--primary)" }}
              >
                {(s.pct * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. CASH FLOW BARS — savings vs spending per month, last 6 months
// ============================================================================

export function CashFlowBars() {
  const transactions = useStore((s) => s.transactions);
  const spending = useStore((s) => s.spending);

  const months = useMemo(() => last6MonthLabels(), []);

  const data = useMemo(() => {
    return months.map((m) => {
      const start = new Date(m.year, m.month, 1).getTime();
      const end = new Date(m.year, m.month + 1, 0, 23, 59, 59).getTime();
      const saved = transactions
        .filter((t) => t.timestamp >= start && t.timestamp <= end && t.type === "save")
        .reduce((sum, t) => sum + t.amount, 0);
      const spent = spending
        .filter((e) => e.timestamp >= start && e.timestamp <= end)
        .reduce((sum, e) => sum + e.amount, 0);
      return { label: m.label, saved, spent };
    });
  }, [transactions, spending, months]);

  const max = Math.max(...data.flatMap((d) => [d.saved, d.spent]), 1);

  // SVG layout
  const W = 480;
  const H = 200;
  const padX = 36;
  const padY = 28;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const barGroupW = chartW / data.length;
  const barW = Math.min(16, barGroupW / 3);

  const yFor = (v: number) => padY + chartH - (v / max) * chartH;

  const gridLines = [0, 0.5, 1].map((p) => padY + chartH - p * chartH);

  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1">6-Month Cash Flow</div>
          <h3 className="font-editorial text-base text-foreground tracking-wide">
            Saved vs Spent
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: "var(--primary)" }} />
            <span className="micro-label">Saved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: "var(--chart-3)" }} />
            <span className="micro-label">Spent</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Gridlines */}
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            y1={y}
            x2={W - padX}
            y2={y}
            stroke="var(--hairline)"
            strokeWidth="1"
            strokeDasharray={i === gridLines.length - 1 ? "" : "2 4"}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const groupCenter = padX + barGroupW * i + barGroupW / 2;
          const savedH = (d.saved / max) * chartH;
          const spentH = (d.spent / max) * chartH;
          return (
            <g key={i}>
              <rect
                x={groupCenter - barW - 2}
                y={yFor(d.saved)}
                width={barW}
                height={savedH}
                fill="var(--primary)"
                rx="1"
                opacity={0.92}
              />
              <rect
                x={groupCenter + 2}
                y={yFor(d.spent)}
                width={barW}
                height={spentH}
                fill="var(--chart-3)"
                rx="1"
                opacity={0.85}
              />
              <text
                x={groupCenter}
                y={H - 8}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-faint)"
                letterSpacing="1.5"
                fontFamily="var(--font-sans)"
              >
                {d.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// 4. GOAL RADIALS — radial progress for each child
// ============================================================================

export function GoalRadials({ childList }: { childList: Child[] }) {
  return (
    <div className="surface-wood rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="micro-label-gold mb-1">Goal Progress</div>
          <h3 className="font-editorial text-base text-foreground tracking-wide">
            Each Child&apos;s Journey
          </h3>
        </div>
        <span className="micro-label">{childList.length} goals</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {childList.map((c) => {
          const pct = Math.min(100, (c.currentAmount / c.goalAmount) * 100);
          const R = 36;
          const C = 2 * Math.PI * R;
          const offset = C - (pct / 100) * C;

          return (
            <div key={c.id} className="flex flex-col items-center text-center">
              <div className="relative">
                <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke="var(--hairline)"
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="font-editorial text-lg tabular-nums"
                    style={{ color: "var(--primary)" }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-foreground/80 tracking-wide">
                {c.name.split(" ")[0]}
              </div>
              <div className="micro-label mt-0.5">{c.goalName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
