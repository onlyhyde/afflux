import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB with chaining — terminal select resolves with stats row
const mockStats = {
  sent: 10,
  delivered: 8,
  opened: 5,
  replied: 2,
  failed: 1,
};

vi.mock("@/lib/db", () => {
  const createChain = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    const methods = [
      "select", "from", "where", "orderBy", "limit", "offset",
      "insert", "values", "update", "set", "delete",
      "innerJoin", "leftJoin", "groupBy",
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.returning = vi.fn().mockResolvedValue([]);
    // Make the chain thenable so await resolves with stats
    chain.then = (resolve: (v: unknown[]) => void) =>
      resolve([mockStats]);
    return chain;
  };
  return { db: createChain() };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

import { outreachRouter } from "@/server/routers/outreach";
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

const VALID_UUID = "a0000000-0000-4000-8000-000000000001";

describe("FEAT-05: getCampaignStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns message counts by status for a campaign", async () => {
    const caller = outreachRouter.createCaller(ctx());
    const result = await caller.getCampaignStats({ campaignId: VALID_UUID });

    expect(result).toHaveProperty("sent");
    expect(result).toHaveProperty("delivered");
    expect(result).toHaveProperty("opened");
    expect(result).toHaveProperty("replied");
    expect(result).toHaveProperty("failed");
  });

  it("returns numeric counts for each status", async () => {
    const caller = outreachRouter.createCaller(ctx());
    const result = await caller.getCampaignStats({ campaignId: VALID_UUID });

    expect(typeof result.sent).toBe("number");
    expect(typeof result.delivered).toBe("number");
    expect(typeof result.opened).toBe("number");
    expect(typeof result.replied).toBe("number");
    expect(typeof result.failed).toBe("number");
  });

  it("returns expected stat values from DB", async () => {
    const caller = outreachRouter.createCaller(ctx());
    const result = await caller.getCampaignStats({ campaignId: VALID_UUID });

    expect(result.sent).toBe(10);
    expect(result.delivered).toBe(8);
    expect(result.opened).toBe(5);
    expect(result.replied).toBe(2);
    expect(result.failed).toBe(1);
  });
});
