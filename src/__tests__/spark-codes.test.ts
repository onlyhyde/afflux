import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB with spark code data including creator join
const mockSparkCodes = [
  {
    id: "sc-001",
    tenantId: "t1",
    creatorId: "c1",
    code: "SPARK_ABC123",
    status: "active",
    expiresAt: new Date("2026-06-01T00:00:00Z"),
    createdAt: new Date("2026-03-01T00:00:00Z"),
    creatorUsername: "creator_one",
    creatorDisplayName: "Creator One",
  },
  {
    id: "sc-002",
    tenantId: "t1",
    creatorId: "c2",
    code: "SPARK_DEF456",
    status: "requested",
    expiresAt: null,
    createdAt: new Date("2026-03-15T00:00:00Z"),
    creatorUsername: "creator_two",
    creatorDisplayName: "Creator Two",
  },
  {
    id: "sc-003",
    tenantId: "t1",
    creatorId: "c3",
    code: "SPARK_GHI789",
    status: "expired",
    expiresAt: new Date("2026-01-01T00:00:00Z"),
    createdAt: new Date("2025-12-01T00:00:00Z"),
    creatorUsername: "creator_three",
    creatorDisplayName: "Creator Three",
  },
];

vi.mock("@/lib/db", () => {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select",
    "from",
    "where",
    "orderBy",
    "limit",
    "offset",
    "innerJoin",
    "leftJoin",
    "groupBy",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.orderBy = vi.fn().mockImplementation(() => {
    const r = Object.create(chain);
    r.limit = vi.fn().mockImplementation(() => {
      const rr = Object.create(chain);
      rr.offset = vi.fn().mockResolvedValue(mockSparkCodes);
      rr.then = (resolve: (v: unknown[]) => void) => resolve(mockSparkCodes);
      return rr;
    });
    r.then = (resolve: (v: unknown[]) => void) => resolve(mockSparkCodes);
    return r;
  });
  return { db: chain };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

import { contentRouter } from "@/server/routers/content";
import type { TRPCContext } from "@/lib/trpc/init";
import { db } from "@/lib/db";

function ctx(): TRPCContext {
  return {
    db: db as unknown as TRPCContext["db"],
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    locale: "en",
    headers: new Headers(),
  };
}

describe("spark codes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("listSparkCodes", () => {
    it("should return spark code records", async () => {
      const caller = contentRouter.createCaller(ctx());
      const result = await caller.listSparkCodes({ page: 1, pageSize: 20 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return spark codes with status and code fields", async () => {
      const caller = contentRouter.createCaller(ctx());
      const result = await caller.listSparkCodes({ page: 1, pageSize: 20 });
      for (const sparkCode of result) {
        expect(sparkCode).toHaveProperty("status");
        expect(sparkCode).toHaveProperty("code");
        expect(typeof sparkCode.code).toBe("string");
        expect(["requested", "received", "active", "expired"]).toContain(
          sparkCode.status
        );
      }
    });

    it("should include creator name fields from join", async () => {
      const caller = contentRouter.createCaller(ctx());
      const result = await caller.listSparkCodes({ page: 1, pageSize: 20 });
      for (const sparkCode of result) {
        expect(sparkCode).toHaveProperty("creatorUsername");
        expect(sparkCode).toHaveProperty("creatorDisplayName");
      }
    });
  });
});
