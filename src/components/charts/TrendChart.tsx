import { useId } from "react";

/**
 * Smooth line chart with gradient area fill, grid lines, and dots.
 * Pure SVG, server-renderable. Renders responsively (viewBox-based).
 */
export function TrendChart({
  data,
  height = 220,
  currency = "",
  className,
}: {
  data: { month: string; amount: number }[];
  height?: number;
  currency?: string;
  className?: string;
}) {
  const areaId = useId();
  const lineId = useId();
  if (data.length === 0) return null;

  const W = 600;
  const H = 220;
  const padL = 44;
  const padR = 18;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = data.map((d) => d.amount);
  const rawMax = Math.max(...values, 0);
  const rawMin = Math.min(...values, 0);
  const span = rawMax - rawMin || 1;
  // Pad range for breathing room.
  const yMax = rawMax + span * 0.15 || 1;
  const yMin = Math.max(0, rawMin - span * 0.1);
  const yRange = yMax - yMin || 1;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = padL + i * xStep;
    const y = padT + innerH - ((d.amount - yMin) / yRange) * innerH;
    return [x, y] as [number, number];
  });

  const linePath = smoothPath(points, 0.6);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${(padT + innerH).toFixed(2)} L ${points[0][0].toFixed(2)} ${(padT + innerH).toFixed(2)} Z`
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => padT + innerH - p * innerH);
  const yLabels = [
    { v: yMax, y: gridLines[0] },
    { v: (yMax + yMin) / 2, y: gridLines[2] },
    { v: yMin, y: gridLines[4] },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full ${className ?? ""}`}
      style={{ height }}
      role="img"
      aria-label="Savings trend over the last six months"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.20} />
          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridLines.map((y, i) => (
        <line
          key={i}
          x1={padL}
          y1={y}
          x2={W - padR}
          y2={y}
          stroke="var(--color-line)"
          strokeWidth={1}
          strokeDasharray={i === gridLines.length - 1 ? "0" : "3 3"}
        />
      ))}

      {/* Y labels */}
      {yLabels.map((l, i) => (
        <text
          key={i}
          x={padL - 8}
          y={l.y}
          dy="0.32em"
          textAnchor="end"
          fill="var(--color-ink-3)"
          style={{ fontSize: 10, fontWeight: 500 }}
        >
          {formatShort(l.v, currency)}
        </text>
      ))}

      {/* Area */}
      {areaPath && <path d={areaPath} fill={`url(#${areaId})`} />}

      {/* Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i} className="cursor-pointer">
          <circle
            cx={p[0]}
            cy={p[1]}
            r={4}
            fill="white"
            stroke="#2563eb"
            strokeWidth={2}
          />
          <title>
            {data[i].month}: {currency ? `${currency} ` : ""}
            {data[i].amount.toLocaleString("en-US")}
          </title>
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={points[i][0]}
          y={H - 8}
          textAnchor="middle"
          fill="var(--color-ink-3)"
          style={{ fontSize: 11, fontWeight: 500 }}
        >
          {d.month}
        </text>
      ))}
    </svg>
  );
}

function smoothPath(points: [number, number][], tension = 0.5): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  if (points.length === 2)
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + ((p2[0] - p0[0]) * tension) / 6;
    const cp1y = p1[1] + ((p2[1] - p0[1]) * tension) / 6;
    const cp2x = p2[0] - ((p3[0] - p1[0]) * tension) / 6;
    const cp2y = p2[1] - ((p3[1] - p1[1]) * tension) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function formatShort(v: number, currency = ""): string {
  const abs = Math.abs(v);
  let s: string;
  if (abs >= 1_000_000) s = (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  else if (abs >= 1000) s = Math.round(abs / 1000) + "K";
  else s = String(Math.round(abs));
  return currency ? `${currency} ${s}` : s;
}
