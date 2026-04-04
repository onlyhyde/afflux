import { describe, it, expect } from "vitest";
import { formatCurrency, formatCompactNumber, formatDate } from "./config";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    const result = formatCurrency(1234.56, "en");
    expect(result).toContain("1,234.56");
  });

  it("formats KRW without decimals", () => {
    const result = formatCurrency(50000, "ko");
    expect(result).toContain("50,000");
    expect(result).not.toContain(".");
  });
});

describe("formatCompactNumber", () => {
  it("formats large numbers compactly", () => {
    const result = formatCompactNumber(1500000, "en");
    expect(result).toMatch(/1\.5M|1,500K/);
  });

  it("formats small numbers without compacting", () => {
    const result = formatCompactNumber(500, "en");
    expect(result).toBe("500");
  });
});

describe("formatDate", () => {
  it("formats date for English locale", () => {
    const date = new Date("2026-04-04T12:00:00Z");
    const result = formatDate(date, "en");
    expect(result).toMatch(/Apr|April/);
    expect(result).toContain("2026");
  });
});
