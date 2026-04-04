import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { contents, outreachMessages, creators, creatorRelationships } from "@/lib/db/schema";
import { sql, eq, gte, lte, and } from "drizzle-orm";

export const analyticsRouter = createTRPCRouter({
  getGmvSummary: publicProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.startDate) conditions.push(gte(contents.publishedAt, input.startDate));
      if (input.endDate) conditions.push(lte(contents.publishedAt, input.endDate));

      const result = await ctx.db
        .select({
          totalGmv: sql<number>`coalesce(sum(${contents.gmv}), 0)`,
          totalViews: sql<number>`coalesce(sum(${contents.views}), 0)`,
          totalConversions: sql<number>`coalesce(sum(${contents.conversions}), 0)`,
          contentCount: sql<number>`count(*)`,
        })
        .from(contents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return result[0];
    }),

  getCreatorPerformance: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          creatorId: contents.creatorId,
          username: creators.username,
          displayName: creators.displayName,
          avatarUrl: creators.avatarUrl,
          totalGmv: sql<number>`coalesce(sum(${contents.gmv}), 0)`,
          totalViews: sql<number>`coalesce(sum(${contents.views}), 0)`,
          contentCount: sql<number>`count(${contents.id})`,
        })
        .from(contents)
        .innerJoin(creators, eq(creators.id, contents.creatorId))
        .groupBy(contents.creatorId, creators.username, creators.displayName, creators.avatarUrl)
        .orderBy(sql`sum(${contents.gmv}) DESC NULLS LAST`)
        .limit(input.limit);
    }),

  getDashboardStats: publicProcedure.query(async ({ ctx }) => {
    const [creatorCount, messageStats, crmStats, contentStats] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)` }).from(creators),
      ctx.db
        .select({
          total: sql<number>`count(*)`,
          replied: sql<number>`count(*) filter (where ${outreachMessages.status} = 'replied')`,
        })
        .from(outreachMessages),
      ctx.db
        .select({
          active: sql<number>`count(*) filter (where ${creatorRelationships.stage} = 'active')`,
          total: sql<number>`count(*)`,
        })
        .from(creatorRelationships),
      ctx.db
        .select({
          totalGmv: sql<number>`coalesce(sum(${contents.gmv}), 0)`,
          avgEngagement: sql<number>`coalesce(avg(${creators.engagementRate}), 0)`,
        })
        .from(contents)
        .leftJoin(creators, eq(creators.id, contents.creatorId)),
    ]);

    return {
      totalCreators: Number(creatorCount[0]?.count ?? 0),
      messagesSent: Number(messageStats[0]?.total ?? 0),
      messagesReplied: Number(messageStats[0]?.replied ?? 0),
      responseRate:
        Number(messageStats[0]?.total) > 0
          ? ((Number(messageStats[0]?.replied) / Number(messageStats[0]?.total)) * 100).toFixed(1)
          : "0",
      activeCreators: Number(crmStats[0]?.active ?? 0),
      totalCrmCreators: Number(crmStats[0]?.total ?? 0),
      totalGmv: Number(contentStats[0]?.totalGmv ?? 0),
      avgEngagement: Number(contentStats[0]?.avgEngagement ?? 0),
    };
  }),
});
