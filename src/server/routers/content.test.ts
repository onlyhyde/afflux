import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "from", "where", "orderBy", "limit", "offset",
    "innerJoin", "leftJoin", "groupBy"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make orderBy return a proper chain that resolves
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
  chain.limit = vi.fn().mockResolvedValue([
    {
      id: "cnt1",
      tenantId: "t1",
      creatorId: "c1",
      title: "Test Video",
      views: 10000,
      likes: 500,
      gmv: "1500.00",
      publishedAt: new Date(),
    },
  ]);
  return { db: chain };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

import { contentRouter } from "./content";
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

describe("content router", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("list", () => {
    it("should return content list", async () => {
      const caller = contentRouter.createCaller(ctx());
      const result = await caller.list({ page: 1, pageSize: 10 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return a single content item", async () => {
      const caller = contentRouter.createCaller(ctx());
      const result = await caller.getById({ id: "a0000000-0000-4000-8000-000000000001" });
      expect(result).toHaveProperty("id");
    });
  });
});
