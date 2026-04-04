import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import {
  tenants,
  users,
  creators,
  outreachMessages,
  activityLogs,
  webhookEvents,
  aiUsageLogs,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  // ── Tenant Management ──────────────────────────

  listTenants: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select({
          tenant: tenants,
          userCount: sql<number>`count(${users.id})`,
        })
        .from(tenants)
        .leftJoin(users, eq(users.tenantId, tenants.id))
        .groupBy(tenants.id)
        .orderBy(desc(tenants.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  getTenant: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  updateTenant: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        plan: z.enum(["free", "starter", "growth", "enterprise", "agency"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const result = await ctx.db
        .update(tenants)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
      return result[0];
    }),

  // ── User Management ────────────────────────────

  listUsers: publicProcedure
    .input(
      z.object({
        tenantId: z.string().uuid().optional(),
        role: z.enum(["owner", "admin", "manager", "viewer"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.tenantId) conditions.push(eq(users.tenantId, input.tenantId));
      if (input.role) conditions.push(eq(users.role, input.role));
      conditions.push(sql`${users.deletedAt} IS NULL`);

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  // ── System Health ──────────────────────────────

  getSystemHealth: publicProcedure.query(async ({ ctx }) => {
    let dbStatus: { status: string; latency: number } = { status: "unknown", latency: 0 };

    const dbStart = Date.now();
    try {
      await ctx.db.execute(sql`SELECT NOW()`);
      dbStatus = { status: "ok", latency: Date.now() - dbStart };
    } catch {
      dbStatus = { status: "error", latency: Date.now() - dbStart };
    }

    return {
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }),

  // ── Queue Stats ────────────────────────────────

  getQueueStats: publicProcedure.query(async () => {
    // Queue stats are fetched from BullMQ via Redis
    // For now, return queue names as a structural foundation
    const queueNames = [
      "outreach:dm",
      "outreach:email",
      "outreach:invite",
      "tiktok:sync",
      "ai:match",
      "notification",
      "spark:check",
      "data:cleanup",
      "billing:webhook",
    ];

    return {
      queues: queueNames.map((name) => ({
        name,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      })),
    };
  }),

  // ── AI Usage ───────────────────────────────────

  getAiUsage: publicProcedure
    .input(
      z.object({
        tenantId: z.string().uuid().optional(),
        feature: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.tenantId) conditions.push(eq(aiUsageLogs.tenantId, input.tenantId));
      if (input.feature) conditions.push(eq(aiUsageLogs.feature, input.feature));

      const result = await ctx.db
        .select({
          feature: aiUsageLogs.feature,
          totalCalls: sql<number>`count(*)`,
          totalInputTokens: sql<number>`coalesce(sum(${aiUsageLogs.inputTokens}), 0)`,
          totalOutputTokens: sql<number>`coalesce(sum(${aiUsageLogs.outputTokens}), 0)`,
        })
        .from(aiUsageLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(aiUsageLogs.feature);

      return result;
    }),

  // ── Activity Logs ──────────────────────────────

  listActivityLogs: publicProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        action: z.enum(["create", "update", "delete", "view", "send", "approve", "reject", "login", "logout"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.entityType) conditions.push(eq(activityLogs.entityType, input.entityType));
      if (input.action) conditions.push(eq(activityLogs.action, input.action));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(activityLogs.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  // ── Webhook Events ─────────────────────────────

  listWebhookEvents: publicProcedure
    .input(
      z.object({
        source: z.string().optional(),
        status: z.enum(["received", "processing", "processed", "failed"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.source) conditions.push(eq(webhookEvents.source, input.source));
      if (input.status) conditions.push(eq(webhookEvents.status, input.status));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(webhookEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(webhookEvents.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  // ── Creator DB Stats ───────────────────────────

  getCreatorDbStats: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        total: sql<number>`count(*)`,
        tiktokShop: sql<number>`count(*) filter (where ${creators.isTiktokShopCreator} = true)`,
        withEmail: sql<number>`count(*) filter (where ${creators.email} IS NOT NULL)`,
        activeRecent: sql<number>`count(*) filter (where ${creators.lastActiveAt} > now() - interval '30 days')`,
        avgTrustScore: sql<number>`coalesce(avg(${creators.trustScore}), 0)`,
      })
      .from(creators)
      .where(sql`${creators.deletedAt} IS NULL`);

    return result[0];
  }),
});
