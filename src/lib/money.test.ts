import { describe, it, expect } from "vitest";
import { formatMoney, formatCompact, parseMoneyInput, minorUnits, pct } from "./money";

describe("minorUnits", () => {
  it("returns 0 for UGX (no minor units)", () => {
    expect(minorUnits("UGX")).toBe(0);
  });

  it("returns 0 for KES, TZS, RWF", () => {
    expect(minorUnits("KES")).toBe(0);
    expect(minorUnits("TZS")).toBe(0);
    expect(minorUnits("RWF")).toBe(0);
  });

  it("returns 2 for USD, EUR, GBP", () => {
    expect(minorUnits("USD")).toBe(2);
    expect(minorUnits("EUR")).toBe(2);
    expect(minorUnits("GBP")).toBe(2);
  });

  it("defaults to 2 for unknown currencies", () => {
    expect(minorUnits("XYZ")).toBe(2);
  });
});

describe("formatMoney", () => {
  it("formats UGX amount correctly (no decimals)", () => {
    expect(formatMoney(150000, "UGX")).toBe("UGX 150,000");
  });

  it("formats large UGX amount with commas", () => {
    expect(formatMoney(2500000, "UGX")).toBe("UGX 2,500,000");
  });

  it("formats zero", () => {
    expect(formatMoney(0, "UGX")).toBe("UGX 0");
  });

  it("formats negative with minus sign", () => {
    expect(formatMoney(-50000, "UGX")).toBe("−UGX 50,000");
  });

  it("formats positive with + sign when signed option is true", () => {
    expect(formatMoney(50000, "UGX", { signed: true })).toBe("+UGX 50,000");
  });

  it("does not add + sign when signed option is false", () => {
    expect(formatMoney(50000, "UGX", { signed: false })).toBe("UGX 50,000");
  });

  it("formats USD with 2 decimal places", () => {
    expect(formatMoney(1250, "USD")).toBe("USD 12.50");
  });

  it("formats USD whole dollars", () => {
    expect(formatMoney(1000, "USD")).toBe("USD 10.00");
  });

  it("defaults to UGX when no currency specified", () => {
    expect(formatMoney(100000)).toBe("UGX 100,000");
  });
});

describe("formatCompact", () => {
  it("formats millions with M suffix", () => {
    // 5,000,000 UGX = 5.0M (one decimal since < 10M)
    expect(formatCompact(5000000, "UGX")).toBe("UGX 5.0M");
  });

  it("formats large millions with one decimal", () => {
    expect(formatCompact(1500000, "UGX")).toBe("UGX 1.5M");
  });

  it("formats very large millions without decimal", () => {
    expect(formatCompact(15000000, "UGX")).toBe("UGX 15M");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCompact(50000, "UGX")).toBe("UGX 50K");
  });

  it("formats small amounts without suffix", () => {
    expect(formatCompact(5000, "UGX")).toBe("UGX 5,000");
  });

  it("handles negative amounts", () => {
    expect(formatCompact(-5000000, "UGX")).toBe("−UGX 5.0M");
  });

  it("formats USD with minor units", () => {
    expect(formatCompact(1000000, "USD")).toBe("USD 10K");
  });
});

describe("parseMoneyInput", () => {
  it("parses plain integer", () => {
    expect(parseMoneyInput("150000", "UGX")).toBe(150000);
  });

  it("parses comma-separated input", () => {
    expect(parseMoneyInput("150,000", "UGX")).toBe(150000);
  });

  it("parses input with spaces", () => {
    expect(parseMoneyInput("150 000", "UGX")).toBe(150000);
  });

  it("parses decimal for USD (converts to minor units)", () => {
    expect(parseMoneyInput("12.50", "USD")).toBe(1250);
  });

  it("parses decimal for USD whole number", () => {
    expect(parseMoneyInput("10", "USD")).toBe(1000);
  });

  it("returns null for non-numeric input", () => {
    expect(parseMoneyInput("abc", "UGX")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseMoneyInput("", "UGX")).toBeNull();
  });

  it("returns null for negative input", () => {
    // Note: the regex /^\d+(\.\d+)?$/ rejects negatives
    expect(parseMoneyInput("-100", "UGX")).toBeNull();
  });

  it("defaults to UGX when no currency specified", () => {
    expect(parseMoneyInput("1000")).toBe(1000);
  });

  it("rounds to nearest minor unit for USD", () => {
    expect(parseMoneyInput("12.505", "USD")).toBe(1251);
  });
});

describe("pct", () => {
  it("calculates simple percentage", () => {
    expect(pct(50, 100)).toBe(50);
  });

  it("returns 0 when whole is 0", () => {
    expect(pct(50, 0)).toBe(0);
  });

  it("returns 0 when whole is negative", () => {
    expect(pct(50, -100)).toBe(0);
  });

  it("returns 100 when part exceeds whole", () => {
    expect(pct(150, 100)).toBe(100);
  });

  it("returns 0 when part is 0", () => {
    expect(pct(0, 100)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 when part equals whole", () => {
    expect(pct(100, 100)).toBe(100);
  });
});
