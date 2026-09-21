import { useId } from "react";

/**
 * Semicircular gauge (0–100) showing the family health score.
 * Pure SVG, server-renderable. Color gradient red → amber → green.
 */
export function HealthGauge({
  score,
  label,
  sublabel,
  size = 220,
  className,
}: {
  score: number;
  label?: string;
  sublabel?: string;
  size?: number;
  className?: string;
}) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const gradId = useId();

  // Geometry — viewBox 220 × 132, arc radius 88 centered at (110, 112)
  const W = 220;
  const H = 132;
  const r = 88;
  const cx = W / 2;
  const cy = 112;
  const stroke = 14;

  // Angle: 180° (left) → 360° (right), sweeping through top (270°).
  const endAngle = (180 + s * 1.8) * (Math.PI / 180);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArc = s > 50 ? 1 : 0;
  const sweep = 1; // clockwise → top arc

  const fullArc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const valueArc =
    s === 0
      ? ""
      : s >= 99.5
        ? fullArc
        : `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX.toFixed(2)} ${endY.toFixed(2)}`;

  // Tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100].map((t) => {
    const a = (180 + t * 1.8) * (Math.PI / 180);
    const inner = r - stroke / 2 - 2;
    const outer = r + stroke / 2 + 2;
    return {
      x1: cx + inner * Math.cos(a),
      y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a),
      y2: cy + outer * Math.sin(a),
    };
  });

  const scoreColor =
    s >= 80 ? "var(--color-save)" : s >= 65 ? "var(--color-accent)" : s >= 45 ? "var(--color-goal)" : "var(--color-spend)";

  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={size}
        height={(size * H) / W}
        role="img"
        aria-label={`Family health score: ${s} out of 100${label ? `, ${label}` : ""}`}
      >
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={cx - r} y1="0" x2={cx + r} y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={fullArc}
          fill="none"
          stroke="var(--color-warm-2)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Value */}
        {valueArc && (
          <path
            d={valueArc}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ transition: "d 0.6s ease" }}
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            stroke="var(--color-line-strong)"
            strokeWidth={1}
          />
        ))}

        {/* Score text */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fill="var(--color-ink)"
          style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          {s}
        </text>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--color-ink-3)"
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          out of 100
        </text>
      </svg>

      {label && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span
            className="text-[14px] font-semibold"
            style={{ color: scoreColor }}
          >
            {label}
          </span>
          {sublabel && <span className="text-[12.5px] text-ink-3">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
