import { db } from "@/lib/db";
import { creators } from "@/lib/db/schema";
import { sql, lte } from "drizzle-orm";

export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find creators needing sync based on last update time
  const staleCreators = await db
    .select({ id: creators.id, tiktokId: creators.tiktokId })
    .from(creators)
    .where(
      sql`${creators.dataUpdatedAt} IS NULL OR ${creators.dataUpdatedAt} < now() - interval '24 hours'`
    )
    .limit(500);

  // Queue sync jobs (lazy import to avoid build-time Redis)
  if (staleCreators.length > 0) {
    const { tiktokSyncQueue } = await import("@/lib/queue/queues");
    for (const creator of staleCreators) {
      if (creator.tiktokId) {
        await tiktokSyncQueue.add("sync", {
          creatorTiktokId: creator.tiktokId,
          priority: "normal",
        });
      }
    }
  }

  return Response.json({
    queued: staleCreators.length,
    timestamp: new Date().toISOString(),
  });
}
