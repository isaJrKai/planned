/**
 * Circular progress ring. Pure SVG, server-renderable.
 * Used for child goal progress on the parent dashboard.
 */
export type RingTone = "brand" | "accent" | "save" | "goal" | "spend" | "grow";

const TONE_STROKE: Record<RingTone, string> = {
  brand: "var(--color-brand)",
  accent: "var(--color-accent)",
  save: "var(--color-save)",
  goal: "var(--color-goal)",
  spend: "var(--color-spend)",
  grow: "var(--color-grow)",
};

export function ProgressRing({
  value,
  size = 64,
  label,
  tone = "brand",
  showValue = true,
  valueSuffix = "%",
  className,
}: {
  value: number; // 0–100
  size?: number;
  label?: string;
  tone?: RingTone;
  showValue?: boolean;
  valueSuffix?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = Math.max(4, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (v / 100) * circ;

  const strokeColor = TONE_STROKE[tone];

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ? `${label}: ${v}${valueSuffix}` : `${v}${valueSuffix}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-warm-2)"
          strokeWidth={stroke}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={`${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </g>
        {showValue && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-ink)"
            style={{ fontSize: size * 0.24, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {v}
            {valueSuffix && (
              <tspan style={{ fontSize: size * 0.14, fill: "var(--color-ink-3)" }}>
                {valueSuffix}
              </tspan>
            )}
          </text>
        )}
      </svg>
      {label && <span className="mt-1 text-[12px] text-ink-3">{label}</span>}
    </div>
  );
}
