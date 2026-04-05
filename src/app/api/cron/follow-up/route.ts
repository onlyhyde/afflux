import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { findInactiveForFollowup } from "@/server/services/cron-jobs";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all active tenants
  const activeTenants = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.isActive, true));

  let totalQueued = 0;

  for (const tenant of activeTenants) {
    const inactive = await findInactiveForFollowup(tenant.id, 14);

    if (inactive.length > 0) {
      // Queue follow-up messages (lazy import to avoid build-time Redis)
      const { outreachEmailQueue } = await import("@/lib/queue/queues");

      for (const creator of inactive) {
        await outreachEmailQueue.add("follow-up", {
          tenantId: tenant.id,
          creatorId: creator.creatorId,
          type: "reactivation",
        });
        totalQueued++;
      }
    }
  }

  return Response.json({
    tenantsChecked: activeTenants.length,
    followUpsQueued: totalQueued,
    timestamp: new Date().toISOString(),
  });
}
