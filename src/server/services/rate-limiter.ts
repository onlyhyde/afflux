/**
 * Rate limiting service using rate_limit_buckets table.
 * Used for:
 * - Outreach DM daily limit (F2-5)
 * - TikTok API rate limits (11-TIKTOK-INTEGRATION.md)
 * - Creator search daily limit (free plan: 50/day)
 */

export interface RateLimitInput {
  count: number;
  limit: number;
  windowEnd?: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number | null; // seconds until window reset
}

export function checkRateLimit(input: RateLimitInput): RateLimitResult {
  const { count, limit, windowEnd } = input;

  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity, retryAfter: null };
  }

  const remaining = Math.max(0, limit - count);
  const allowed = count < limit;

  let retryAfter: number | null = null;
  if (!allowed && windowEnd) {
    retryAfter = Math.max(0, Math.ceil((windowEnd.getTime() - Date.now()) / 1000));
  }

  return { allowed, remaining, retryAfter };
}
