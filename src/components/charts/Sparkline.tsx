import { useId } from "react";

/**
 * Tiny inline sparkline for trend indicators on dense cards.
 * Pure SVG, server-renderable, no axes or labels — just shape.
 */
export type SparkTone = "brand" | "accent" | "save" | "goal" | "spend";

const TONE_COLOR: Record<SparkTone, string> = {
  brand: "#0052cc",
  accent: "#7c5cfc",
  save: "#00a76f",
  goal: "#ffab00",
  spend: "#ff3b30",
};

export function Sparkline({
  data,
  width = 80,
  height = 24,
  tone = "accent",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: SparkTone;
  className?: string;
}) {
  const gradId = useId();

  if (data.length < 2) {
    // Render an empty placeholder so layout doesn't shift.
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-hidden
      />
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const xStep = width / (data.length - 1);
  const padY = 2;

  const points = data.map((v, i) => {
    const x = i * xStep;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y] as [number, number];
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const lineColor = TONE_COLOR[tone];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
