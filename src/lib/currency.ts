// ============================================================================
// MULTI-CURRENCY SERVICE
// ============================================================================
// Supports UGX, USD, KES, TZS, RWF. Family selects their currency in settings.
// All amounts stored as integers (smallest unit). Format on display.

export type CurrencyCode = "UGX" | "USD" | "KES" | "TZS" | "RWF";

export const CURRENCIES: Record<CurrencyCode, {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}> = {
  UGX: { code: "UGX", symbol: "USh", name: "Ugandan Shilling", locale: "en-UG", decimals: 0 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", decimals: 2 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE", decimals: 0 },
  TZS: { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", locale: "en-TZ", decimals: 0 },
  RWF: { code: "RWF", symbol: "RFr", name: "Rwandan Franc", locale: "en-RW", decimals: 0 },
};

export function formatCurrency(amount: number, currency: CurrencyCode = "UGX"): string {
  const c = CURRENCIES[currency];
  const formatted = new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(amount);
  return `${c.symbol} ${formatted}`;
}

export function formatCurrencyPlain(amount: number, currency: CurrencyCode = "UGX"): string {
  const c = CURRENCIES[currency];
  return new Intl.NumberFormat(c.locale, {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(amount);
}

export function getCurrencySymbol(currency: CurrencyCode = "UGX"): string {
  return CURRENCIES[currency].symbol;
}

// Legacy compat — keep existing UGX formatters working
export function formatUGX(n: number): string {
  return formatCurrency(n, "UGX");
}

export function formatUGXPlain(n: number): string {
  return formatCurrencyPlain(n, "UGX");
}
