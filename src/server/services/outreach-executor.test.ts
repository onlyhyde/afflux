import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeCampaign,
  checkDailyLimit,
  filterDuplicateContacts,
} from "./outreach-executor";

// Mock DB
const mockResults = {
  campaignMembers: [
    { creator: { id: "c1", username: "creator1", email: "c1@test.com" } },
    { creator: { id: "c2", username: "creator2", email: "c2@test.com" } },
    { creator: { id: "c3", username: "creator3", email: "c3@test.com" } },
  ],
  existingContacts: [{ creatorId: "c2" }],
  rateBucket: [{ count: 500, limit: 1000 }],
  campaign: [{
    id: "camp1",
    tenantId: "t1",
    name: "Test Campaign",
    status: "draft",
    targetListId: "list1",
    templateId: "tmpl1",
  }],
  template: [{
    id: "tmpl1",
    body: "Hi {{creator_name}}!",
    channel: "email",
  }],
};

vi.mock("@/lib/db", () => {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "from", "where", "orderBy", "limit", "offset",
    "insert", "values", "returning", "update", "set", "innerJoin",
    "leftJoin", "groupBy", "delete"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Different responses based on call context
  let callCount = 0;
  chain.limit = vi.fn().mockImplementation(() => {
    callCount++;
    return Promise.resolve(
      callCount === 1 ? mockResults.campaign :
      callCount === 2 ? mockResults.template :
      []
    );
  });
  return { db: chain };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

// Mock queue
const mockQueueAdd = vi.fn().mockResolvedValue({ id: "job-1" });
vi.mock("@/lib/queue/queues", () => ({
  outreachDmQueue: { add: (...args: unknown[]) => mockQueueAdd(...args) },
  outreachEmailQueue: { add: (...args: unknown[]) => mockQueueAdd(...args) },
  outreachInviteQueue: { add: (...args: unknown[]) => mockQueueAdd(...args) },
}));

describe("Outreach Executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filterDuplicateContacts", () => {
    it("should remove creators already contacted in this campaign", () => {
      const allCreators = [
        { id: "c1", username: "a" },
        { id: "c2", username: "b" },
        { id: "c3", username: "c" },
      ];
      const existingContactIds = new Set(["c2"]);

      const filtered = filterDuplicateContacts(allCreators, existingContactIds);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((c) => c.id)).toEqual(["c1", "c3"]);
    });

    it("should return all if none previously contacted", () => {
      const allCreators = [{ id: "c1", username: "a" }];
      const filtered = filterDuplicateContacts(allCreators, new Set());
      expect(filtered).toHaveLength(1);
    });
  });

  describe("checkDailyLimit", () => {
    it("should return remaining count when under limit", () => {
      const result = checkDailyLimit(500, 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(500);
    });

    it("should block when at limit", () => {
      const result = checkDailyLimit(1000, 1000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should handle Infinity limit (unlimited plan)", () => {
      const result = checkDailyLimit(99999, Infinity);
      expect(result.allowed).toBe(true);
    });
  });
});
