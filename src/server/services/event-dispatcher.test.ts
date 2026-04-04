import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  dispatchEvent,
  detectInactiveCreators,
  type AppEvent,
} from "./event-dispatcher";

// Mock notification service
const mockCreateNotification = vi.fn().mockResolvedValue({ id: "n1" });
vi.mock("./notification-service", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

// Mock DB for follow-up
vi.mock("@/lib/db", () => {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "from", "where", "orderBy", "limit", "offset",
    "innerJoin", "leftJoin"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.limit = vi.fn().mockResolvedValue([]);
  return { db: chain };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

describe("Event Dispatcher", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("dispatchEvent", () => {
    it("should create notification when creator replies", async () => {
      const event: AppEvent = {
        type: "creator_replied",
        tenantId: "t1",
        userId: "u1",
        data: {
          creatorName: "Sarah",
          creatorId: "c1",
          messageId: "m1",
        },
      };

      await dispatchEvent(event);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "creator_reply",
          tenantId: "t1",
          sendEmail: true,
        })
      );
    });

    it("should create notification when content is uploaded", async () => {
      const event: AppEvent = {
        type: "content_uploaded",
        tenantId: "t1",
        userId: "u1",
        data: {
          creatorName: "Jake",
          contentId: "cnt1",
        },
      };

      await dispatchEvent(event);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "content_uploaded",
          sendEmail: true,
        })
      );
    });

    it("should create notification for sample request", async () => {
      const event: AppEvent = {
        type: "sample_requested",
        tenantId: "t1",
        userId: "u1",
        data: {
          creatorName: "Luna",
          productName: "Glow Serum",
          sampleId: "s1",
        },
      };

      await dispatchEvent(event);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "sample_request",
          sendEmail: true,
        })
      );
    });

    it("should NOT send email for campaign events", async () => {
      const event: AppEvent = {
        type: "campaign_completed",
        tenantId: "t1",
        userId: "u1",
        data: { campaignId: "c1", campaignName: "Beauty Q1" },
      };

      await dispatchEvent(event);

      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          sendEmail: false,
        })
      );
    });
  });

  describe("detectInactiveCreators", () => {
    it("should return array of inactive creator IDs", async () => {
      const result = await detectInactiveCreators("t1", 14);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
