import { Job } from "bullmq";
import { db } from "@/lib/db";
import { outreachMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface OutreachEmailJobData {
  tenantId: string;
  messageId: string;
  campaignId: string;
  to: string;
  subject: string;
  body: string;
  replyTo: string;
}

export async function processOutreachEmail(job: Job<OutreachEmailJobData>) {
  const { messageId, to, subject, body } = job.data;

  try {
    // TODO: Call SendGrid API
    // const response = await sendgrid.send({
    //   to,
    //   from: process.env.EMAIL_FROM!,
    //   subject,
    //   html: body,
    //   replyTo: job.data.replyTo,
    // });

    console.log(`[outreach:email] Sending email to ${to}: ${subject}`);

    await db
      .update(outreachMessages)
      .set({
        status: "sent",
        sentAt: new Date(),
      })
      .where(eq(outreachMessages.id, messageId));

    return { success: true, messageId };
  } catch (error) {
    await db
      .update(outreachMessages)
      .set({
        status: "failed",
        failReason: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(outreachMessages.id, messageId));

    throw error;
  }
}
