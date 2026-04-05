import { db } from "@/lib/db";
import { sparkCodes, creatorRelationships } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * Find spark codes expiring within N days.
 * Used by /api/cron/check-spark-codes
 */
export async function findExpiringSparkcodes(withinDays: number = 3) {
  return db
    .select()
    .from(sparkCodes)
    .where(
      and(
        eq(sparkCodes.status, "active"),
        sql`${sparkCodes.expiresAt} IS NOT NULL`,
        sql`${sparkCodes.expiresAt} BETWEEN now() AND now() + interval '${sql.raw(String(withinDays))} days'`
      )
    )
    .limit(100);
}

/**
 * Find active CRM creators that haven't been contacted recently.
 * Used by /api/cron/follow-up
 */
export async function findInactiveForFollowup(
  tenantId: string,
  inactiveDays: number = 14
) {
  return db
    .select({
      relationshipId: creatorRelationships.id,
      creatorId: creatorRelationships.creatorId,
      tenantId: creatorRelationships.tenantId,
      lastContactedAt: creatorRelationships.lastContactedAt,
    })
    .from(creatorRelationships)
    .where(
      and(
        eq(creatorRelationships.tenantId, tenantId),
        eq(creatorRelationships.stage, "active"),
        sql`(${creatorRelationships.lastContactedAt} IS NULL
          OR ${creatorRelationships.lastContactedAt} < now() - interval '${sql.raw(String(inactiveDays))} days')`
      )
    )
    .limit(100);
}
