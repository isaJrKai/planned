import { useId } from "react";

/**
 * SVG donut chart with hover tooltips (native <title>).
 * Pure SVG, server-renderable. Hover effects via CSS opacity.
 */
export function SpendingDonut({
  data,
  size = 180,
  centerValue,
  centerLabel,
  className,
}: {
  data: { label: string; amount: number; color: string }[];
  size?: number;
  centerValue?: string;
  centerLabel?: string;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const r = 60;
  const stroke = 20;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2 : 0; // px gap between segments

  let offset = 0;
  const segments = data.map((d, i) => {
    const frac = total > 0 ? d.amount / total : 0;
    const dash = Math.max(0, frac * circ - gap);
    const seg = {
      color: d.color,
      label: d.label,
      amount: d.amount,
      pct: Math.round(frac * 100),
      dashArray: `${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`,
      dashOffset: -offset,
    };
    offset += frac * circ;
    return seg;
  });

  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={
        total > 0
          ? `Spending breakdown: ${data.map((d) => `${d.label} ${Math.round((d.amount / total) * 100)}%`).join(", ")}`
          : "No spending recorded this month"
      }
    >
      {/* Track ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-warm-2)"
        strokeWidth={stroke}
      />

      {/* Segments — rotated -90° so they start from the top */}
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {total > 0 &&
          segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset.toFixed(2)}
              strokeLinecap={data.length === 1 ? "round" : "butt"}
              className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
              style={{ transformOrigin: "center" }}
            >
              <title>
                {seg.label}: {seg.amount.toLocaleString("en-US")} ({seg.pct}%)
              </title>
            </circle>
          ))}
      </g>

      {/* Center text */}
      {centerValue && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--color-ink)"
          style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill="var(--color-ink-3)"
          style={{ fontSize: 10, fontWeight: 500 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

/** Legend row pairing the donut with category labels, amounts, and percentages. */
export function DonutLegend({
  data,
  total,
  currency,
}: {
  data: { label: string; amount: number; color: string }[];
  total: number;
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <p className="text-[13.5px] text-ink-3">No spending recorded this month.</p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const pctVal = total > 0 ? Math.round((d.amount / total) * 100) : 0;
        return (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[13.5px]">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: d.color }}
                aria-hidden
              />
              <span className="text-ink-2 truncate">{d.label}</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="tnum text-ink-3 text-[12.5px]">{pctVal}%</span>
              <span className="tnum text-ink font-medium">
                {currency} {d.amount.toLocaleString("en-US")}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
