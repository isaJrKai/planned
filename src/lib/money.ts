/** Money helpers. All amounts are integers in minor units. */

const MINOR_UNITS: Record<string, number> = { UGX: 0, KES: 0, TZS: 0, RWF: 0, USD: 2, EUR: 2, GBP: 2 };

export function minorUnits(currency: string) {
  return MINOR_UNITS[currency] ?? 2;
}

export function formatMoney(amount: number, currency = "UGX", opts: { signed?: boolean } = {}) {
  const digits = minorUnits(currency);
  const major = amount / Math.pow(10, digits);
  const abs = Math.abs(major).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = amount < 0 ? "−" : opts.signed && amount > 0 ? "+" : "";
  return `${sign}${currency} ${abs}`;
}

export function formatCompact(amount: number, currency = "UGX") {
  const digits = minorUnits(currency);
  const major = amount / Math.pow(10, digits);
  const abs = Math.abs(major);
  let s: string;
  if (abs >= 1_000_000) s = (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  else if (abs >= 10_000) s = Math.round(abs / 1000) + "K";
  else s = abs.toLocaleString("en-US", { maximumFractionDigits: digits });
  return `${major < 0 ? "−" : ""}${currency} ${s}`;
}

/** Parse a user-typed major amount ("150,000" or "12.50") into minor units. */
export function parseMoneyInput(input: string, currency = "UGX"): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const digits = minorUnits(currency);
  const n = Math.round(parseFloat(cleaned) * Math.pow(10, digits));
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return n;
}

export function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}
