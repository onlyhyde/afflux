import { Job } from "bullmq";
import { db } from "@/lib/db";
import { outreachMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface OutreachDmJobData {
  tenantId: string;
  messageId: string;
  campaignId: string;
  creatorId: string;
  message: string;
  shopAccessToken: string;
}

export async function processOutreachDm(job: Job<OutreachDmJobData>) {
  const { messageId, message } = job.data;

  try {
    // TODO: Call TikTok Messaging API
    // const response = await tiktokApi.sendDm({
    //   accessToken: job.data.shopAccessToken,
    //   recipientId: job.data.creatorId,
    //   message: job.data.message,
    // });

    // For now, simulate sending
    console.log(`[outreach:dm] Sending DM to creator ${job.data.creatorId}`);

    // Update message status to sent
    await db
      .update(outreachMessages)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(outreachMessages.id, messageId));

    return { success: true, messageId };
  } catch (error) {
    // Update message status to failed
    await db
      .update(outreachMessages)
      .set({
        status: "failed",
        failReason: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(outreachMessages.id, messageId));

    throw error; // Let BullMQ handle retry
  }
}
