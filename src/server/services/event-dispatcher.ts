import { createNotification } from "./notification-service";
import { db } from "@/lib/db";
import { creatorRelationships, outreachMessages } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Application events that trigger notifications and automated actions.
 * Maps to 09-NOTIFICATION.md trigger conditions and 01-PRD.md F14.
 */
export type AppEvent =
  | { type: "creator_replied"; tenantId: string; userId: string | null; data: { creatorName: string; creatorId: string; messageId: string } }
  | { type: "content_uploaded"; tenantId: string; userId: string | null; data: { creatorName: string; contentId: string } }
  | { type: "sample_requested"; tenantId: string; userId: string | null; data: { creatorName: string; productName: string; sampleId: string } }
  | { type: "spark_code_expiring"; tenantId: string; userId: string | null; data: { creatorName: string; code: string; expiresAt: string } }
  | { type: "campaign_completed"; tenantId: string; userId: string | null; data: { campaignId: string; campaignName: string } }
  | { type: "campaign_failed"; tenantId: string; userId: string | null; data: { campaignId: string; campaignName: string; reason: string } }
  | { type: "payment_succeeded"; tenantId: string; userId: string | null; data: { amount: number; currency: string } }
  | { type: "payment_failed"; tenantId: string; userId: string | null; data: { reason: string } };

/**
 * Event → Notification mapping.
 * Follows 09-NOTIFICATION.md default preferences table.
 */
const EVENT_CONFIG: Record<
  AppEvent["type"],
  {
    notificationType: string;
    titleFn: (data: Record<string, unknown>) => string;
    sendEmail: boolean;
    linkFn?: (data: Record<string, unknown>) => string;
  }
> = {
  creator_replied: {
    notificationType: "creator_reply",
    titleFn: (d) => `${d.creatorName} replied to your message`,
    sendEmail: true,
    linkFn: () => "/crm",
  },
  content_uploaded: {
    notificationType: "content_uploaded",
    titleFn: (d) => `${d.creatorName} uploaded new content`,
    sendEmail: true,
    linkFn: () => "/content",
  },
  sample_requested: {
    notificationType: "sample_request",
    titleFn: (d) => `${d.creatorName} requested a sample of ${d.productName}`,
    sendEmail: true,
    linkFn: () => "/campaigns",
  },
  spark_code_expiring: {
    notificationType: "spark_code_expiring",
    titleFn: (d) => `Spark code ${d.code} expires on ${d.expiresAt}`,
    sendEmail: false,
    linkFn: () => "/content",
  },
  campaign_completed: {
    notificationType: "campaign",
    titleFn: (d) => `Campaign "${d.campaignName}" completed`,
    sendEmail: false,
    linkFn: (d) => `/outreach`,
  },
  campaign_failed: {
    notificationType: "campaign",
    titleFn: (d) => `Campaign "${d.campaignName}" failed: ${d.reason}`,
    sendEmail: false,
  },
  payment_succeeded: {
    notificationType: "billing",
    titleFn: (d) => `Payment of ${d.currency} ${d.amount} succeeded`,
    sendEmail: true,
    linkFn: () => "/settings",
  },
  payment_failed: {
    notificationType: "billing",
    titleFn: (d) => `Payment failed: ${d.reason}`,
    sendEmail: true,
    linkFn: () => "/settings",
  },
};

/**
 * Dispatch an application event.
 * Creates notification and triggers any automated actions.
 */
export async function dispatchEvent(event: AppEvent) {
  const config = EVENT_CONFIG[event.type];
  if (!config) return;

  const data = event.data as Record<string, unknown>;

  await createNotification({
    tenantId: event.tenantId,
    userId: event.userId,
    type: config.notificationType as Parameters<typeof createNotification>[0]["type"],
    title: config.titleFn(data),
    link: config.linkFn?.(data),
    sendEmail: config.sendEmail,
  });
}

/**
 * F5: Detect inactive creators (no content uploaded in N days).
 * Used by cron job to trigger follow-up sequences.
 */
export async function detectInactiveCreators(
  tenantId: string,
  inactiveDays: number = 14
): Promise<string[]> {
  const results = await db
    .select({ creatorId: creatorRelationships.creatorId })
    .from(creatorRelationships)
    .where(
      and(
        eq(creatorRelationships.tenantId, tenantId),
        eq(creatorRelationships.stage, "active"),
        sql`${creatorRelationships.lastContactedAt} < now() - interval '${sql.raw(String(inactiveDays))} days'`
      )
    )
    .limit(100);

  return results.map((r) => r.creatorId);
}
