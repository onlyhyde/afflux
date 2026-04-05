import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted constants (available inside vi.mock factories) ───
const { TOTAL_CREATORS, PAGE_SIZE, ALL_CREATORS } = vi.hoisted(() => {
  const TOTAL_CREATORS = 50;
  const PAGE_SIZE = 20;

  function makeCreator(i: number) {
    return {
      id: `c0000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      username: `creator_${i}`,
      displayName: `Creator ${i}`,
      category: "Beauty",
      country: "US",
      followers: 100_000 - i * 100,
      engagementRate: "4.5",
      gmv: "5000",
      isTiktokShopCreator: true,
      trustScore: 80,
      avatarUrl: null,
      bio: null,
      searchVector: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const ALL_CREATORS = Array.from({ length: TOTAL_CREATORS }, (_, i) => makeCreator(i + 1));

  return { TOTAL_CREATORS, PAGE_SIZE, ALL_CREATORS };
});

vi.mock("@/lib/db", () => {
  const createChain = () => {
    let _where: unknown;
    let _limit = PAGE_SIZE;
    let _offset = 0;

    const chain: Record<string, ReturnType<typeof vi.fn>> = {};

    chain.select = vi.fn().mockReturnValue(chain);
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockImplementation((w) => {
      _where = w;
      return chain;
    });
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.groupBy = vi.fn().mockReturnValue(chain);
    chain.innerJoin = vi.fn().mockReturnValue(chain);
    chain.leftJoin = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.values = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockResolvedValue([]);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);

    chain.limit = vi.fn().mockImplementation((n: number) => {
      _limit = n;
      const limitChain = Object.create(chain);
      limitChain.offset = vi.fn().mockImplementation((o: number) => {
        _offset = o;
        return Promise.resolve(ALL_CREATORS.slice(o, o + n));
      });
      // If no offset is called, resolve with sliced data
      limitChain.then = (resolve: (v: unknown) => void) =>
        resolve(ALL_CREATORS.slice(_offset, _offset + n));
      return limitChain;
    });

    chain.offset = vi.fn().mockImplementation((o: number) => {
      _offset = o;
      return Promise.resolve(ALL_CREATORS.slice(o, o + _limit));
    });

    // For the count query: select({ count }) → from → where → resolves [{ count }]
    const origSelect = chain.select;
    chain.select = vi.fn().mockImplementation((arg?: Record<string, unknown>) => {
      if (arg && "count" in arg) {
        // Return a count chain
        const countChain: Record<string, ReturnType<typeof vi.fn>> = {};
        countChain.from = vi.fn().mockReturnValue(countChain);
        countChain.where = vi.fn().mockReturnValue(countChain);
        countChain.then = (resolve: (v: unknown) => void) =>
          resolve([{ count: TOTAL_CREATORS }]);
        return countChain;
      }
      return origSelect(arg);
    });

    return chain;
  };

  return { db: createChain() };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

vi.mock("@/lib/search/fulltext", () => ({
  buildSearchQuery: vi.fn().mockReturnValue(null),
  sanitizeSearchInput: vi.fn((s: string) => s),
}));

// ── Import after mocks ──────────────────────────────────────
import { creatorRouter } from "@/server/routers/creator";
import type { TRPCContext } from "@/lib/trpc/init";
import { db } from "@/lib/db";

function createCtx(overrides: Partial<TRPCContext> = {}): TRPCContext {
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

describe("creator.list pagination", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns correct pagination metadata (total, page, totalPages)", async () => {
    const caller = creatorRouter.createCaller(createCtx());

    const result = await caller.list({
      page: 1,
      pageSize: PAGE_SIZE,
      sortBy: "followers",
      sortOrder: "desc",
    });

    // Must include pagination fields
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(result).toHaveProperty("items");

    // Verify metadata values
    expect(result.total).toBe(TOTAL_CREATORS);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(Math.ceil(TOTAL_CREATORS / PAGE_SIZE));
    expect(result.items.length).toBeLessThanOrEqual(PAGE_SIZE);
  });

  it("page 2 returns different results than page 1", async () => {
    const caller = creatorRouter.createCaller(createCtx());

    const page1 = await caller.list({
      page: 1,
      pageSize: PAGE_SIZE,
      sortBy: "followers",
      sortOrder: "desc",
    });

    const page2 = await caller.list({
      page: 2,
      pageSize: PAGE_SIZE,
      sortBy: "followers",
      sortOrder: "desc",
    });

    // Both pages should have items
    expect(page1.items.length).toBeGreaterThan(0);
    expect(page2.items.length).toBeGreaterThan(0);

    // Pages should be different
    expect(page2.page).toBe(2);

    // Items should be different (different offset)
    const page1Ids = page1.items.map((c) => c.id);
    const page2Ids = page2.items.map((c) => c.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("returns correct totalPages for non-even division", async () => {
    const caller = creatorRouter.createCaller(createCtx());

    // 50 creators / 20 per page = 3 pages (20 + 20 + 10)
    const result = await caller.list({
      page: 1,
      pageSize: PAGE_SIZE,
      sortBy: "followers",
      sortOrder: "desc",
    });

    expect(result.totalPages).toBe(3); // ceil(50/20) = 3
  });
});
