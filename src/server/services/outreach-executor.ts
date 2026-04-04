import { db } from "@/lib/db";
import {
  outreachCampaigns,
  outreachMessages,
  outreachTemplates,
  creatorListMembers,
  creators,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Filter out creators that have already been contacted in this campaign.
 * PRD F2-6: 중복 발송 방지
 */
export function filterDuplicateContacts<T extends { id: string }>(
  allCreators: T[],
  existingContactIds: Set<string>
): T[] {
  return allCreators.filter((c) => !existingContactIds.has(c.id));
}

/**
 * Check daily sending limit.
 * PRD F2-5: 일일 발송 한도 관리
 */
export function checkDailyLimit(
  currentCount: number,
  limit: number
): { allowed: boolean; remaining: number } {
  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity };
  }
  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: currentCount < limit,
    remaining,
  };
}

/**
 * Execute a campaign — the core outreach flow.
 *
 * Flow:
 * 1. Load campaign + template
 * 2. Load target creator list
 * 3. Filter duplicates (already contacted)
 * 4. Check daily limit
 * 5. Generate personalized messages
 * 6. Insert messages into DB (status: pending)
 * 7. Queue messages for sending
 * 8. Update campaign status to "running"
 */
export async function executeCampaign(params: {
  campaignId: string;
  tenantId: string;
  userId: string;
  dailyLimit: number;
}) {
  const { campaignId, tenantId, userId, dailyLimit } = params;

  // 1. Load campaign
  const campaign = await db
    .select()
    .from(outreachCampaigns)
    .where(
      and(
        eq(outreachCampaigns.id, campaignId),
        eq(outreachCampaigns.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!campaign[0]) throw new Error("Campaign not found");
  if (!campaign[0].targetListId) throw new Error("Campaign has no target list");
  if (!campaign[0].templateId) throw new Error("Campaign has no template");

  const camp = campaign[0];

  // 2. Load template
  const template = await db
    .select()
    .from(outreachTemplates)
    .where(eq(outreachTemplates.id, camp.templateId!))
    .limit(1);

  if (!template[0]) throw new Error("Template not found");
  const tmpl = template[0];

  // 3. Load target creators
  const targetCreators = await db
    .select({ creator: creators })
    .from(creatorListMembers)
    .innerJoin(creators, eq(creators.id, creatorListMembers.creatorId))
    .where(eq(creatorListMembers.listId, camp.targetListId!));

  // 4. Filter already contacted
  const existingMessages = await db
    .select({ creatorId: outreachMessages.creatorId })
    .from(outreachMessages)
    .where(eq(outreachMessages.campaignId, campaignId));

  const contactedIds = new Set(existingMessages.map((m) => m.creatorId));
  const newTargets = filterDuplicateContacts(
    targetCreators.map((r) => r.creator),
    contactedIds
  );

  // 5. Check daily limit
  const todayCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachMessages)
    .where(
      and(
        eq(outreachMessages.tenantId, tenantId),
        sql`${outreachMessages.createdAt} > now() - interval '1 day'`
      )
    );

  const limitCheck = checkDailyLimit(Number(todayCount[0]?.count ?? 0), dailyLimit);
  const messagesToSend = newTargets.slice(0, limitCheck.remaining === Infinity ? newTargets.length : limitCheck.remaining);

  if (messagesToSend.length === 0) {
    return { queued: 0, reason: limitCheck.allowed ? "no_new_targets" : "daily_limit_reached" };
  }

  // 6. Insert messages as pending
  const messageValues = messagesToSend.map((creator) => ({
    tenantId,
    campaignId,
    creatorId: creator.id,
    channel: tmpl.channel,
    status: "pending" as const,
    body: tmpl.body
      .replace(/\{\{creator_name\}\}/g, creator.displayName ?? creator.username)
      .replace(/\{\{creator_username\}\}/g, creator.username),
    locale: tmpl.locale,
  }));

  // Batch insert (500 at a time)
  for (let i = 0; i < messageValues.length; i += 500) {
    await db.insert(outreachMessages).values(messageValues.slice(i, i + 500));
  }

  // 7. Queue for sending (lazy import to avoid build-time Redis)
  const { outreachDmQueue, outreachEmailQueue, outreachInviteQueue } =
    await import("@/lib/queue/queues");

  const queue =
    tmpl.channel === "email"
      ? outreachEmailQueue
      : tmpl.channel === "tiktok_invite"
        ? outreachInviteQueue
        : outreachDmQueue;

  for (const msg of messageValues) {
    await queue.add("send", {
      tenantId,
      campaignId,
      creatorId: msg.creatorId,
      message: msg.body,
    });
  }

  // 8. Update campaign status
  await db
    .update(outreachCampaigns)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(outreachCampaigns.id, campaignId));

  return {
    queued: messagesToSend.length,
    skippedDuplicate: contactedIds.size,
    skippedLimit: newTargets.length - messagesToSend.length,
  };
}
