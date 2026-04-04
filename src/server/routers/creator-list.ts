import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { creatorLists, creatorListMembers, creators } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const creatorListRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const lists = await ctx.db
      .select({
        list: creatorLists,
        memberCount: sql<number>`count(${creatorListMembers.id})`,
      })
      .from(creatorLists)
      .leftJoin(creatorListMembers, eq(creatorListMembers.listId, creatorLists.id))
      .where(sql`${creatorLists.deletedAt} IS NULL`)
      .groupBy(creatorLists.id)
      .orderBy(desc(creatorLists.createdAt));

    return lists;
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(creatorLists)
        .values({
          tenantId: ctx.tenantId ?? "00000000-0000-0000-0000-000000000000",
          ...input,
        })
        .returning();
      return result[0];
    }),

  addMember: publicProcedure
    .input(z.object({ listId: z.string().uuid(), creatorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(creatorListMembers).values({
        tenantId: ctx.tenantId ?? "00000000-0000-0000-0000-000000000000",
        listId: input.listId,
        creatorId: input.creatorId,
      });
      return { success: true };
    }),

  removeMember: publicProcedure
    .input(z.object({ listId: z.string().uuid(), creatorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(creatorListMembers)
        .where(
          and(
            eq(creatorListMembers.listId, input.listId),
            eq(creatorListMembers.creatorId, input.creatorId)
          )
        );
      return { success: true };
    }),

  getMembers: publicProcedure
    .input(z.object({ listId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({ creator: creators })
        .from(creatorListMembers)
        .innerJoin(creators, eq(creators.id, creatorListMembers.creatorId))
        .where(eq(creatorListMembers.listId, input.listId));
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(creatorLists)
        .set({ deletedAt: new Date() })
        .where(eq(creatorLists.id, input.id));
      return { success: true };
    }),
});
