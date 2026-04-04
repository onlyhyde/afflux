import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { notificationQueue } from "@/lib/queue/queues";

export interface CreateNotificationInput {
  tenantId: string;
  userId: string | null;
  type:
    | "system"
    | "campaign"
    | "creator_reply"
    | "sample_request"
    | "content_uploaded"
    | "spark_code_expiring"
    | "billing";
  title: string;
  body?: string;
  link?: string;
  sendEmail?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  // 1. Save to DB
  const result = await db
    .insert(notifications)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    })
    .returning();

  const notification = result[0];

  // 2. Queue email if requested
  if (input.sendEmail) {
    await notificationQueue.add("send-email", {
      notificationId: notification.id,
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
    });
  }

  return notification;
}
