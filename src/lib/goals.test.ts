import { describe, it, expect } from "vitest";
import { forecastGoal, projectSavings, weeksToReach } from "./goals";

// Helper to create a transaction-like object
function contribution(amount: number, daysAgo: number, kind: "deposit" | "allowance" | "transfer" | "spend" | "goal_contribution" | "goal_withdrawal" | "adjustment" | "reversal" = "goal_contribution") {
  return { amount, createdAt: new Date(Date.now() - daysAgo * 86400000), kind };
}

describe("forecastGoal", () => {
  it("returns zero rate when no contributions exist", () => {
    const f = forecastGoal(500000, 0, []);
    expect(f.weeklyRate).toBe(0);
    expect(f.weeksRemaining).toBeNull();
    expect(f.estimatedDate).toBeNull();
    expect(f.weeksObserved).toBe(0);
    expect(f.consistentWeeks).toBe(0);
  });

  it("returns 0 weeks remaining when goal is already reached", () => {
    const f = forecastGoal(500000, 500000, [contribution(500000, 7)]);
    expect(f.weeksRemaining).toBe(0);
    expect(f.estimatedDate).toBeInstanceOf(Date);
  });

  it("returns 0 weeks remaining when saved exceeds target", () => {
    const f = forecastGoal(500000, 600000, [contribution(600000, 7)]);
    expect(f.weeksRemaining).toBe(0);
  });

  it("calculates weekly rate from contributions", () => {
    const f = forecastGoal(500000, 0, [contribution(50000, 7)]);
    expect(f.weeklyRate).toBeGreaterThan(0);
  });

  it("estimates weeks remaining based on rate", () => {
    // 50,000/week for 1 week, target 500,000
    const f = forecastGoal(500000, 0, [contribution(50000, 7)]);
    expect(f.weeksRemaining).toBe(10); // 450,000 remaining / 50,000 per week
  });

  it("returns null for weeks remaining when rate is 0", () => {
    const f = forecastGoal(500000, 0, [contribution(0, 7)]);
    expect(f.weeksRemaining).toBeNull();
  });

  it("counts consistent weeks (consecutive weeks with contributions)", () => {
    // Contributions in the last 3 weeks
    const contributions = [
      contribution(5000, 2),  // this week
      contribution(5000, 9),  // last week
      contribution(5000, 16), // week before
    ];
    const f = forecastGoal(500000, 0, contributions);
    expect(f.consistentWeeks).toBeGreaterThanOrEqual(2);
  });

  it("breaks streak when a week is missed", () => {
    // Contributions 3 weeks ago and 1 week ago (gap in week 2)
    const contributions = [
      contribution(5000, 2),   // this week
      contribution(5000, 16),  // 2 weeks ago (gap last week)
    ];
    const f = forecastGoal(500000, 0, contributions);
    expect(f.consistentWeeks).toBe(1); // only this week
  });
});

describe("projectSavings", () => {
  it("calculates simple savings without interest", () => {
    // 10,000/week for 10 weeks, no interest
    const total = projectSavings(10000, 10, 0);
    expect(total).toBe(100000);
  });

  it("returns 0 for 0 weeks", () => {
    expect(projectSavings(10000, 0, 0)).toBe(0);
  });

  it("returns 0 for 0 weekly amount", () => {
    expect(projectSavings(0, 10, 0)).toBe(0);
  });

  it("applies compound interest", () => {
    // With interest, total should be more than simple sum
    const simple = projectSavings(10000, 52, 0);
    const withInterest = projectSavings(10000, 52, 10); // 10% annual
    expect(withInterest).toBeGreaterThan(simple);
  });

  it("handles single week", () => {
    expect(projectSavings(50000, 1, 0)).toBe(50000);
  });
});

describe("weeksToReach", () => {
  it("calculates weeks to reach a target", () => {
    expect(weeksToReach(500000, 50000)).toBe(10);
  });

  it("returns null for zero weekly rate", () => {
    expect(weeksToReach(500000, 0)).toBeNull();
  });

  it("returns null for negative weekly rate", () => {
    expect(weeksToReach(500000, -100)).toBeNull();
  });

  it("returns 1 when weekly rate exceeds remaining", () => {
    expect(weeksToReach(1000, 5000)).toBe(1);
  });

  it("returns 0 when remaining is 0", () => {
    expect(weeksToReach(0, 5000)).toBe(0);
  });

  it("rounds up to nearest week", () => {
    expect(weeksToReach(100001, 50000)).toBe(3); // ceil(2.00002) = 3
  });

  it("handles exact division", () => {
    expect(weeksToReach(100000, 25000)).toBe(4);
  });
});
