import { describe, it, expect } from "vitest";
import { goalProgress, sumBetween } from "./earnings";

describe("earnings", () => {
  it("caps goal progress at 100%", () => expect(goalProgress(300, 200)).toBe(100));
  it("shows 0% when no goal is set", () => expect(goalProgress(50, null)).toBe(0));
  it("prefers commission over amount and respects dates", () => {
    const rows = [
      { amount: 100, commission: 10, date: "2026-11-03T00:00:00Z" },
      { amount: 40, commission: null, date: "2026-11-04T00:00:00Z" },
      { amount: 999, commission: 99, date: "2026-10-01T00:00:00Z" },
    ];
    expect(sumBetween(rows, new Date("2026-11-01T00:00:00Z"), new Date("2026-11-10T00:00:00Z"))).toBe(50);
  });
});
