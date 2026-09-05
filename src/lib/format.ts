export function relDate(d: Date | string, now = new Date()) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}
export function longDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function timeOfDay(d = new Date()) { const h = d.getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
export function firstName(n: string) { return n.split(" ")[0]; }
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function txnLabel(kind: string) {
  return ({ deposit: "Added to pool", allowance: "Allowance", transfer: "Transfer", spend: "Spent", goal_contribution: "Saved to goal", goal_withdrawal: "Goal withdrawal", adjustment: "Adjustment", reversal: "Reversal" } as Record<string, string>)[kind] ?? kind;
}
export function txnTone(kind: string): "brand" | "save" | "goal" | "spend" | "grow" | "neutral" {
  return ({ deposit: "brand", allowance: "brand", transfer: "neutral", spend: "spend", goal_contribution: "save", goal_withdrawal: "goal", adjustment: "neutral", reversal: "neutral" } as Record<string, "brand" | "save" | "goal" | "spend" | "grow" | "neutral">)[kind] ?? "neutral";
}
