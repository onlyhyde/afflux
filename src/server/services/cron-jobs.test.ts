import { describe, it, expect, vi, beforeEach } from "vitest";
import { findExpiringSparkcodes, findInactiveForFollowup } from "./cron-jobs";

// Mock DB
const mockSelect = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      const chain: Record<string, unknown> = {};
      chain.from = vi.fn().mockReturnValue(chain);
      chain.where = vi.fn().mockReturnValue(chain);
      chain.innerJoin = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue([]);
      return chain;
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

describe("Cron Jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("findExpiringSparkcodes", () => {
    it("should return array of expiring spark codes", async () => {
      const result = await findExpiringSparkcodes(3);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("findInactiveForFollowup", () => {
    it("should return array of inactive creator IDs", async () => {
      const result = await findInactiveForFollowup("tenant-1", 14);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
