import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const items = await ctx.db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return items;
    }),

  getUnreadCount: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));

    return Number(result[0]?.count ?? 0);
  }),

  markAsRead: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllAsRead: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.isRead, false));
    return { success: true };
  }),
});
