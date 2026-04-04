import { describe, it, expect } from "vitest";
import { checkRateLimit, type RateLimitResult } from "./rate-limiter";

describe("Rate Limiter", () => {
  it("should allow when count is below limit", () => {
    const result = checkRateLimit({ count: 500, limit: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(500);
    expect(result.retryAfter).toBeNull();
  });

  it("should block when count equals limit", () => {
    const result = checkRateLimit({ count: 1000, limit: 1000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should block when count exceeds limit", () => {
    const result = checkRateLimit({ count: 1500, limit: 1000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should calculate retryAfter when blocked", () => {
    const windowEnd = new Date(Date.now() + 3600000); // 1 hour from now
    const result = checkRateLimit({ count: 1000, limit: 1000, windowEnd });
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).not.toBeNull();
    expect(result.retryAfter!).toBeGreaterThan(0);
    expect(result.retryAfter!).toBeLessThanOrEqual(3600);
  });

  it("should handle zero limit (feature disabled)", () => {
    const result = checkRateLimit({ count: 0, limit: 0 });
    expect(result.allowed).toBe(false);
  });

  it("should handle Infinity limit (unlimited plan)", () => {
    const result = checkRateLimit({ count: 999999, limit: Infinity });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });
});
