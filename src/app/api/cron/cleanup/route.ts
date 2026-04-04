import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, number> = {};

  // 1. Hard-delete soft-deleted records older than 90 days
  const tables = [
    "tenants", "users", "shops", "products", "creators",
    "creator_lists", "outreach_templates", "outreach_campaigns",
  ];

  for (const table of tables) {
    const result = await db.execute(
      sql.raw(
        `DELETE FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '90 days'`
      )
    );
    results[`${table}_purged`] = 0; // Count not easily available from raw SQL
  }

  // 2. Clean old activity logs (>2 years)
  await db.execute(
    sql`DELETE FROM activity_logs WHERE created_at < now() - interval '2 years'`
  );

  // 3. Clean old webhook events (>30 days)
  await db.execute(
    sql`DELETE FROM webhook_events WHERE created_at < now() - interval '30 days'`
  );

  return Response.json({
    cleaned: results,
    timestamp: new Date().toISOString(),
  });
}
