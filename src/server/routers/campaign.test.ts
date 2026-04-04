import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB with proper chaining (all methods return `this`, terminal methods resolve)
vi.mock("@/lib/db", () => {
  const createChain = (terminal: unknown = []) => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = [
      "select", "from", "where", "orderBy", "limit", "offset",
      "insert", "values", "update", "set", "delete",
      "innerJoin", "leftJoin", "groupBy",
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    // Terminal: returning resolves with data, offset/limit also resolve for queries
    chain.returning = vi.fn().mockResolvedValue([{
      id: "a0000000-0000-0000-0000-000000000001",
      tenantId: "t1",
      status: "approved",
      createdAt: new Date(),
    }]);
    // Make offset resolve (terminal for paginated queries)
    const origOffset = chain.offset;
    chain.offset = vi.fn().mockResolvedValue([]);
    // Make limit also resolve when it's terminal (e.g., listCompetitors has no offset)
    chain.limit = vi.fn().mockImplementation(() => {
      const r = Object.create(chain);
      r.then = (resolve: (v: unknown[]) => void) => resolve([]);
      r.offset = vi.fn().mockResolvedValue([]);
      return r;
    });
    // orderBy returns chainable
    chain.orderBy = vi.fn().mockImplementation(() => {
      const r = Object.create(chain);
      r.limit = vi.fn().mockImplementation(() => {
        const rr = Object.create(chain);
        rr.offset = vi.fn().mockResolvedValue([]);
        rr.then = (resolve: (v: unknown[]) => void) => resolve([]);
        return rr;
      });
      r.then = (resolve: (v: unknown[]) => void) => resolve([]);
      return r;
    });
    return chain;
  };
  return { db: createChain() };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

import { campaignRouter } from "./campaign";
import type { TRPCContext } from "@/lib/trpc/init";
import { db } from "@/lib/db";

function ctx(overrides: Partial<TRPCContext> = {}): TRPCContext {
  return {
    db: db as unknown as TRPCContext["db"],
    tenantId: "t0000000-0000-0000-0000-000000000001",
    userId: "u0000000-0000-0000-0000-000000000001",
    role: "owner",
    locale: "en",
    headers: new Headers(),
    ...overrides,
  };
}

const VALID_UUID = "a0000000-0000-4000-8000-000000000001"; // valid UUID v4

describe("campaign router", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("F4: Samples", () => {
    it("listSamples returns array", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.listSamples({ page: 1, pageSize: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("approveSample updates status", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.approveSample({ sampleId: VALID_UUID });
      expect(result).toHaveProperty("id");
    });

    it("rejectSample updates status", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.rejectSample({ sampleId: VALID_UUID });
      expect(result).toHaveProperty("id");
    });
  });

  describe("F10: Contests", () => {
    it("listContests returns array", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.listContests({ page: 1, pageSize: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("createContest with required fields", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.createContest({
        name: "Beauty Contest Q1",
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-31"),
        rankingMetric: "gmv",
      });
      expect(result).toHaveProperty("id");
    });
  });

  describe("F9: Competitors", () => {
    it("listCompetitors returns array", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.listCompetitors();
      expect(Array.isArray(result)).toBe(true);
    });

    it("addCompetitor creates brand entry", async () => {
      const caller = campaignRouter.createCaller(ctx());
      const result = await caller.addCompetitor({
        name: "Rival Brand",
        tiktokShopUrl: "https://tiktok.com/shop/rival",
        category: "Beauty",
      });
      expect(result).toHaveProperty("id");
    });
  });
});
