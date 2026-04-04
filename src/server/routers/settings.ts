import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { tenants, users, invitations } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

export const settingsRouter = createTRPCRouter({
  getTenant: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) return null;
    const result = await ctx.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);
    return result[0] ?? null;
  }),

  updateTenant: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        locale: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) return null;
      const result = await ctx.db
        .update(tenants)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(tenants.id, ctx.tenantId))
        .returning();
      return result[0];
    }),

  listMembers: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) return [];
    return ctx.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), sql`${users.deletedAt} IS NULL`))
      .orderBy(desc(users.createdAt));
  }),

  inviteMember: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "manager", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) return null;
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const result = await ctx.db
        .insert(invitations)
        .values({
          tenantId: ctx.tenantId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.userId,
          token,
          expiresAt,
        })
        .returning();

      // TODO: Send invitation email via notification queue
      return result[0];
    }),

  removeMember: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) return null;
      await ctx.db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.tenantId)));
      return { success: true };
    }),

  updateMemberRole: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "manager", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) return null;
      const result = await ctx.db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(and(eq(users.id, input.userId), eq(users.tenantId, ctx.tenantId)))
        .returning();
      return result[0];
    }),
});
