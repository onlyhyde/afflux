import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { contents, sparkCodes, creators } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const contentRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        creatorId: z.string().uuid().optional(),
        productId: z.string().uuid().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.creatorId) conditions.push(eq(contents.creatorId, input.creatorId));
      if (input.productId) conditions.push(eq(contents.productId, input.productId));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(contents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(contents.publishedAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(contents)
        .where(eq(contents.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  getCreatorContents: publicProcedure
    .input(z.object({ creatorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(contents)
        .where(eq(contents.creatorId, input.creatorId))
        .orderBy(desc(contents.publishedAt))
        .limit(50);
    }),

  listSparkCodes: publicProcedure
    .input(
      z.object({
        status: z.enum(["requested", "received", "active", "expired"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.status) conditions.push(eq(sparkCodes.status, input.status));

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db
        .select()
        .from(sparkCodes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sparkCodes.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),
});
