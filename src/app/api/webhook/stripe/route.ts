import { db } from "@/lib/db";
import { billingEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyStripeSignature } from "@/lib/webhook/verify";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  // 1. Verify signature
  if (!verifyStripeSignature(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "")) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse event
  let event: { id: string; type: string; data: { object: unknown } };
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Idempotency check — skip if already processed
  const existing = await db
    .select({ id: billingEvents.id })
    .from(billingEvents)
    .where(eq(billingEvents.stripeEventId, event.id))
    .limit(1);

  if (existing.length > 0) {
    return Response.json({ received: true }); // Already processed
  }

  // 4. Record billing event
  await db.insert(billingEvents).values({
    tenantId: "00000000-0000-0000-0000-000000000000", // TODO: resolve from Stripe customer
    stripeEventId: event.id,
    eventType: event.type,
    details: event.data.object,
  });

  // 5. Queue async processing (lazy import to avoid build-time Redis connection)
  const { billingWebhookQueue } = await import("@/lib/queue/queues");
  await billingWebhookQueue.add(event.type, {
    stripeEventId: event.id,
    eventType: event.type,
    payload: event.data.object,
  });

  return Response.json({ received: true });
}
