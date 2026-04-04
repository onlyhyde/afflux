import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import {
  samples,
  contests,
  contestParticipants,
  competitorBrands,
  creators,
  products,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const campaignRouter = createTRPCRouter({
  // ══════════════════════════════════════════════
  // F4: Samples
  // ══════════════════════════════════════════════

  listSamples: publicProcedure
    .input(
      z.object({
        status: z
          .enum([
            "requested", "approved", "rejected", "shipped",
            "delivered", "content_pending", "completed",
          ])
          .optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(samples.status, input.status));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(samples)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(samples.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  approveSample: publicProcedure
    .input(z.object({ sampleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(samples)
        .set({
          status: "approved",
          approvedBy: ctx.userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(samples.id, input.sampleId))
        .returning();
      return result[0];
    }),

  rejectSample: publicProcedure
    .input(z.object({ sampleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(samples)
        .set({
          status: "rejected",
          approvedBy: ctx.userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(samples.id, input.sampleId))
        .returning();
      return result[0];
    }),

  requestSample: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        creatorId: z.string().uuid(),
        shippingAddress: z.record(z.string(), z.string()).optional(),
        contentDueDays: z.number().min(1).default(14),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contentDueAt = new Date(
        Date.now() + input.contentDueDays * 24 * 60 * 60 * 1000
      );

      const result = await ctx.db
        .insert(samples)
        .values({
          tenantId: ctx.tenantId ?? "00000000-0000-0000-0000-000000000000",
          productId: input.productId,
          creatorId: input.creatorId,
          status: "requested",
          shippingAddress: input.shippingAddress,
          contentDueAt,
        })
        .returning();

      return result[0];
    }),

  shipSample: publicProcedure
    .input(
      z.object({
        sampleId: z.string().uuid(),
        trackingNumber: z.string(),
        trackingUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(samples)
        .set({
          status: "shipped",
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
          shippedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(samples.id, input.sampleId))
        .returning();
      return result[0];
    }),

  // ══════════════════════════════════════════════
  // F10: Contests
  // ══════════════════════════════════════════════

  listContests: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "active", "ended", "settled"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(contests.status, input.status));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(contests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(contests.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  createContest: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        rankingMetric: z.string().default("gmv"),
        rules: z.record(z.string(), z.unknown()).optional(),
        prizes: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(contests)
        .values({
          tenantId: ctx.tenantId ?? "00000000-0000-0000-0000-000000000000",
          name: input.name,
          description: input.description,
          status: "draft",
          startDate: input.startDate,
          endDate: input.endDate,
          rankingMetric: input.rankingMetric,
          rules: input.rules,
          prizes: input.prizes,
          createdBy: ctx.userId,
        })
        .returning();
      return result[0];
    }),

  getContestLeaderboard: publicProcedure
    .input(z.object({ contestId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          participant: contestParticipants,
          creator: creators,
        })
        .from(contestParticipants)
        .innerJoin(creators, eq(creators.id, contestParticipants.creatorId))
        .where(eq(contestParticipants.contestId, input.contestId))
        .orderBy(desc(contestParticipants.gmv));
    }),

  // ══════════════════════════════════════════════
  // F9: Competitor Brands
  // ══════════════════════════════════════════════

  listCompetitors: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(competitorBrands)
      .where(eq(competitorBrands.isActive, true))
      .orderBy(desc(competitorBrands.createdAt));
  }),

  addCompetitor: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        tiktokShopUrl: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(competitorBrands)
        .values({
          tenantId: ctx.tenantId ?? "00000000-0000-0000-0000-000000000000",
          name: input.name,
          tiktokShopUrl: input.tiktokShopUrl,
          category: input.category,
        })
        .returning();
      return result[0];
    }),

  removeCompetitor: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(competitorBrands)
        .set({ isActive: false })
        .where(eq(competitorBrands.id, input.id));
      return { success: true };
    }),
});
