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
        .select({
          id: contents.id,
          tiktokVideoId: contents.tiktokVideoId,
          title: contents.title,
          views: contents.views,
          likes: contents.likes,
          comments: contents.comments,
          shares: contents.shares,
          conversions: contents.conversions,
          gmv: contents.gmv,
          publishedAt: contents.publishedAt,
          creatorId: contents.creatorId,
          creatorUsername: creators.username,
          creatorDisplayName: creators.displayName,
        })
        .from(contents)
        .leftJoin(creators, eq(contents.creatorId, creators.id))
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
        .select({
          id: sparkCodes.id,
          tenantId: sparkCodes.tenantId,
          creatorId: sparkCodes.creatorId,
          code: sparkCodes.code,
          status: sparkCodes.status,
          expiresAt: sparkCodes.expiresAt,
          createdAt: sparkCodes.createdAt,
          creatorUsername: creators.username,
          creatorDisplayName: creators.displayName,
        })
        .from(sparkCodes)
        .leftJoin(creators, eq(sparkCodes.creatorId, creators.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sparkCodes.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),
});
