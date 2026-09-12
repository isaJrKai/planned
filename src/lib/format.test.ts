import { describe, it, expect } from "vitest";
import { relDate, longDate, timeOfDay, firstName, txnLabel, txnTone } from "./format";

describe("relDate", () => {
  it("returns 'just now' for very recent times", () => {
    const now = new Date();
    expect(relDate(new Date(now.getTime() - 5000), now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const now = new Date("2026-01-15T12:00:00");
    const past = new Date("2026-01-15T11:30:00");
    expect(relDate(past, now)).toBe("30 min ago");
  });

  it("returns hours ago", () => {
    const now = new Date("2026-01-15T12:00:00");
    const past = new Date("2026-01-15T09:00:00");
    expect(relDate(past, now)).toBe("3 h ago");
  });

  it("returns days ago", () => {
    const now = new Date("2026-01-15T12:00:00");
    const past = new Date("2026-01-12T12:00:00");
    expect(relDate(past, now)).toBe("3 d ago");
  });

  it("returns formatted date for older than a week", () => {
    const now = new Date("2026-06-15T12:00:00");
    const past = new Date("2026-05-01T12:00:00");
    const result = relDate(past, now);
    expect(result).toContain("May");
    expect(result).toContain("1");
  });

  it("includes year for dates in different year", () => {
    const now = new Date("2026-06-15T12:00:00");
    const past = new Date("2024-05-01T12:00:00");
    const result = relDate(past, now);
    expect(result).toContain("2024");
  });

  it("accepts string date", () => {
    const now = new Date("2026-01-15T12:00:00");
    // 5 minutes ago → "5 min ago" (not "just now" which is < 60s)
    expect(relDate("2026-01-15T11:55:00", now)).toBe("5 min ago");
  });
});

describe("longDate", () => {
  it("formats a date with weekday, day, month, year", () => {
    const result = longDate(new Date("2026-06-15"));
    expect(result).toContain("15");
    expect(result).toContain("Jun");
    expect(result).toContain("2026");
  });

  it("accepts string date", () => {
    const result = longDate("2026-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("timeOfDay", () => {
  it("returns 'Good morning' before noon", () => {
    expect(timeOfDay(new Date("2026-01-15T08:00:00"))).toBe("Good morning");
  });

  it("returns 'Good afternoon' between noon and 5pm", () => {
    expect(timeOfDay(new Date("2026-01-15T14:00:00"))).toBe("Good afternoon");
  });

  it("returns 'Good evening' after 5pm", () => {
    expect(timeOfDay(new Date("2026-01-15T19:00:00"))).toBe("Good evening");
  });

  it("returns 'Good morning' at exactly midnight", () => {
    expect(timeOfDay(new Date("2026-01-15T00:00:00"))).toBe("Good morning");
  });

  it("returns 'Good afternoon' at exactly noon", () => {
    expect(timeOfDay(new Date("2026-01-15T12:00:00"))).toBe("Good afternoon");
  });

  it("returns 'Good evening' at exactly 5pm", () => {
    expect(timeOfDay(new Date("2026-01-15T17:00:00"))).toBe("Good evening");
  });
});

describe("firstName", () => {
  it("extracts first name from full name", () => {
    expect(firstName("John Doe")).toBe("John");
  });

  it("handles single name", () => {
    expect(firstName("Sarah")).toBe("Sarah");
  });

  it("handles multiple middle names", () => {
    expect(firstName("Alexander the Great Sterling")).toBe("Alexander");
  });

  it("handles empty string", () => {
    expect(firstName("")).toBe("");
  });
});

describe("txnLabel", () => {
  it("labels deposit", () => {
    expect(txnLabel("deposit")).toBe("Added to pool");
  });

  it("labels allowance", () => {
    expect(txnLabel("allowance")).toBe("Allowance");
  });

  it("labels spend", () => {
    expect(txnLabel("spend")).toBe("Spent");
  });

  it("labels goal_contribution", () => {
    expect(txnLabel("goal_contribution")).toBe("Saved to goal");
  });

  it("returns original for unknown kind", () => {
    expect(txnLabel("unknown_type")).toBe("unknown_type");
  });
});

describe("txnTone", () => {
  it("returns brand tone for deposit", () => {
    expect(txnTone("deposit")).toBe("brand");
  });

  it("returns spend tone for spend", () => {
    expect(txnTone("spend")).toBe("spend");
  });

  it("returns save tone for goal_contribution", () => {
    expect(txnTone("goal_contribution")).toBe("save");
  });

  it("returns neutral for unknown kind", () => {
    expect(txnTone("unknown")).toBe("neutral");
  });
});
