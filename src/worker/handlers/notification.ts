import { Job } from "bullmq";

export interface NotificationJobData {
  notificationId: string;
  tenantId: string;
  userId: string | null;
  type: string;
  sendEmail: boolean;
}

export async function processNotification(job: Job<NotificationJobData>) {
  const { notificationId, sendEmail, type } = job.data;

  console.log(`[notification] Processing ${type} notification ${notificationId}`);

  if (sendEmail) {
    // TODO: Fetch notification details, render email template, send via SendGrid
    console.log(`[notification] Sending email for ${type}`);
  }

  return { success: true, notificationId };
}
