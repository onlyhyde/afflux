import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import {
  outreachTemplates,
  outreachCampaigns,
  outreachMessages,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const templateCreateSchema = z.object({
  name: z.string().min(1).max(255),
  locale: z.string().default("en"),
  channel: z.enum(["tiktok_dm", "tiktok_invite", "email"]),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

const campaignCreateSchema = z.object({
  name: z.string().min(1).max(255),
  shopId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  targetListId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const outreachRouter = createTRPCRouter({
  // ── Templates ────────────────────────────────
  listTemplates: publicProcedure
    .input(
      z.object({
        locale: z.string().optional(),
        channel: z.enum(["tiktok_dm", "tiktok_invite", "email"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.locale) conditions.push(eq(outreachTemplates.locale, input.locale));
      if (input.channel) conditions.push(eq(outreachTemplates.channel, input.channel));

      return ctx.db
        .select()
        .from(outreachTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(outreachTemplates.createdAt));
    }),

  createTemplate: publicProcedure
    .input(templateCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(outreachTemplates)
        .values({
          tenantId: "00000000-0000-0000-0000-000000000000", // TODO: from auth context
          ...input,
        })
        .returning();
      return result[0];
    }),

  // ── Campaigns ────────────────────────────────
  listCampaigns: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(outreachCampaigns)
      .orderBy(desc(outreachCampaigns.createdAt));
  }),

  createCampaign: publicProcedure
    .input(campaignCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(outreachCampaigns)
        .values({
          tenantId: "00000000-0000-0000-0000-000000000000", // TODO: from auth context
          ...input,
        })
        .returning();
      return result[0];
    }),

  // ── Message Stats ────────────────────────────
  getMessageStats: publicProcedure
    .input(z.object({ campaignId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.campaignId) {
        conditions.push(eq(outreachMessages.campaignId, input.campaignId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const stats = await ctx.db
        .select({
          total: sql<number>`count(*)`,
          sent: sql<number>`count(*) filter (where ${outreachMessages.status} = 'sent')`,
          delivered: sql<number>`count(*) filter (where ${outreachMessages.status} = 'delivered')`,
          opened: sql<number>`count(*) filter (where ${outreachMessages.status} = 'opened')`,
          replied: sql<number>`count(*) filter (where ${outreachMessages.status} = 'replied')`,
          failed: sql<number>`count(*) filter (where ${outreachMessages.status} = 'failed')`,
        })
        .from(outreachMessages)
        .where(where);

      return stats[0] ?? { total: 0, sent: 0, delivered: 0, opened: 0, replied: 0, failed: 0 };
    }),

  // ── Campaign Execution ──────────────────────────

  startCampaign: publicProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { executeCampaign } = await import("@/server/services/outreach-executor");
      const { getPlanLimits } = await import("@/server/services/plan-limits");

      // Get tenant plan limits
      const tenantId = ctx.tenantId ?? "00000000-0000-0000-0000-000000000000";
      const limits = getPlanLimits("growth"); // TODO: get from actual tenant plan

      return executeCampaign({
        campaignId: input.campaignId,
        tenantId,
        userId: ctx.userId ?? "",
        dailyLimit: limits.dmPerMonth / 30, // Approximate daily from monthly
      });
    }),

  pauseCampaign: publicProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(outreachCampaigns)
        .set({ status: "paused", updatedAt: new Date() })
        .where(eq(outreachCampaigns.id, input.campaignId))
        .returning();
      return result[0];
    }),
});
