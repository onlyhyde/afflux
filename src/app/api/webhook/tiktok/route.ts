import { db } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";
import { verifyTikTokSignature } from "@/lib/webhook/verify";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-tiktok-signature") ?? "";
  const timestamp = request.headers.get("x-tiktok-timestamp") ?? "";

  // 1. Verify signature
  if (
    !verifyTikTokSignature(
      body,
      signature,
      timestamp,
      process.env.TIKTOK_APP_SECRET ?? ""
    )
  ) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse event
  let event: { type: string; data: unknown };
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Record webhook event
  await db.insert(webhookEvents).values({
    source: "tiktok",
    eventType: event.type,
    payload: event,
  });

  // 4. Process by event type
  switch (event.type) {
    case "ORDER_STATUS_CHANGE":
      // TODO: Update GMV, creator performance
      break;
    case "MESSAGE_RECEIVE":
      // TODO: Update outreach message status → replied
      break;
    case "PRODUCT_STATUS_CHANGE":
      // TODO: Sync product status
      break;
    case "CREATOR_AUTHORIZATION":
      // TODO: Update creator TikTok Shop status
      break;
  }

  return Response.json({ success: true });
}
