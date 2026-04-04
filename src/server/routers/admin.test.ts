import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Admin router tests — unit tests with mocked DB.
 * Tests verify the router logic without requiring a real database.
 */

// Mock DB module
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}));

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

// Import after mocks
import { adminRouter } from "./admin";
import type { TRPCContext } from "@/lib/trpc/init";
import { db } from "@/lib/db";

function createMockContext(overrides: Partial<TRPCContext> = {}): TRPCContext {
  return {
    db: db as unknown as TRPCContext["db"],
    tenantId: null,
    userId: null,
    role: null,
    locale: "en",
    headers: new Headers(),
    ...overrides,
  };
}

describe("admin router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTenants", () => {
    it("should return tenant list with user counts", async () => {
      const mockTenants = [
        {
          tenant: {
            id: "t1",
            name: "Test Corp",
            plan: "starter",
            locale: "en",
            currency: "USD",
            isActive: true,
            createdAt: new Date(),
          },
          userCount: 3,
        },
      ];

      // Mock the chained query
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue(mockTenants),
      };

      const ctx = createMockContext({ db: mockQuery as unknown as TRPCContext["db"] });
      const caller = adminRouter.createCaller(ctx);

      const result = await caller.listTenants({ page: 1, pageSize: 10 });

      expect(result).toEqual(mockTenants);
      expect(mockQuery.select).toHaveBeenCalled();
    });
  });

  describe("getSystemHealth", () => {
    it("should return health status with db check", async () => {
      const mockQuery = {
        execute: vi.fn().mockResolvedValue([{ now: new Date() }]),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
      };

      const ctx = createMockContext({ db: mockQuery as unknown as TRPCContext["db"] });
      const caller = adminRouter.createCaller(ctx);

      const result = await caller.getSystemHealth();

      expect(result).toHaveProperty("database");
      expect(result).toHaveProperty("timestamp");
      expect(result.database.status).toBe("ok");
    });

    it("should report error when db is down", async () => {
      const mockQuery = {
        execute: vi.fn().mockRejectedValue(new Error("Connection refused")),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
      };

      const ctx = createMockContext({ db: mockQuery as unknown as TRPCContext["db"] });
      const caller = adminRouter.createCaller(ctx);

      const result = await caller.getSystemHealth();

      expect(result.database.status).toBe("error");
    });
  });

  describe("getQueueStats", () => {
    it("should return queue statistics", async () => {
      const ctx = createMockContext();
      const caller = adminRouter.createCaller(ctx);

      const result = await caller.getQueueStats();

      expect(result).toHaveProperty("queues");
      expect(Array.isArray(result.queues)).toBe(true);
    });
  });
});
