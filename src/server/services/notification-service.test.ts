import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotification, type CreateNotificationInput } from "./notification-service";

// Mock DB
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([
      {
        id: "notif-1",
        tenantId: "t1",
        userId: "u1",
        type: "creator_reply",
        title: "Sarah replied",
        body: "Check your DMs",
        isRead: false,
        createdAt: new Date(),
      },
    ]),
  }),
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}));

// Mock notification queue
const mockQueueAdd = vi.fn().mockResolvedValue({ id: "job-1" });
vi.mock("@/lib/queue/queues", () => ({
  notificationQueue: {
    add: (...args: unknown[]) => mockQueueAdd(...args),
  },
}));

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a notification in DB", async () => {
    const input: CreateNotificationInput = {
      tenantId: "t1",
      userId: "u1",
      type: "creator_reply",
      title: "Sarah replied",
      body: "Check your DMs",
      link: "/crm",
    };

    const result = await createNotification(input);

    expect(result).toHaveProperty("id", "notif-1");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("should queue email when sendEmail is true", async () => {
    const input: CreateNotificationInput = {
      tenantId: "t1",
      userId: "u1",
      type: "billing",
      title: "Payment succeeded",
      sendEmail: true,
    };

    await createNotification(input);

    expect(mockQueueAdd).toHaveBeenCalledWith(
      "send-email",
      expect.objectContaining({
        notificationId: "notif-1",
        tenantId: "t1",
      })
    );
  });

  it("should NOT queue email when sendEmail is false", async () => {
    const input: CreateNotificationInput = {
      tenantId: "t1",
      userId: "u1",
      type: "campaign",
      title: "Campaign completed",
      sendEmail: false,
    };

    await createNotification(input);

    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it("should NOT queue email by default", async () => {
    const input: CreateNotificationInput = {
      tenantId: "t1",
      userId: "u1",
      type: "spark_code_expiring",
      title: "Spark code expires soon",
    };

    await createNotification(input);

    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});
