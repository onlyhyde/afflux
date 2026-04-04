import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { creators } from "@/lib/db/schema";
import { desc, asc, ilike, and, gte, lte, eq, sql } from "drizzle-orm";
import { buildSearchQuery, sanitizeSearchInput } from "@/lib/search/fulltext";

const creatorFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  minFollowers: z.number().optional(),
  maxFollowers: z.number().optional(),
  minEngagement: z.number().optional(),
  maxEngagement: z.number().optional(),
  minGmv: z.number().optional(),
  maxGmv: z.number().optional(),
  isTiktokShopCreator: z.boolean().optional(),
  sortBy: z
    .enum(["followers", "engagement_rate", "gmv", "created_at"])
    .default("followers"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export const creatorRouter = createTRPCRouter({
  list: publicProcedure.input(creatorFilterSchema).query(async ({ ctx, input }) => {
    const conditions = [];

    if (input.search) {
      const tsquery = buildSearchQuery(input.search);
      if (tsquery) {
        // Use tsvector indexed search when available, fallback to ILIKE
        conditions.push(
          sql`(${creators.searchVector} @@ plainto_tsquery('english', ${sanitizeSearchInput(input.search)})
            OR ${creators.username} ILIKE ${`%${input.search}%`}
            OR ${creators.displayName} ILIKE ${`%${input.search}%`})`
        );
      }
    }
    if (input.category) {
      conditions.push(eq(creators.category, input.category));
    }
    if (input.country) {
      conditions.push(eq(creators.country, input.country));
    }
    if (input.minFollowers !== undefined) {
      conditions.push(gte(creators.followers, input.minFollowers));
    }
    if (input.maxFollowers !== undefined) {
      conditions.push(lte(creators.followers, input.maxFollowers));
    }
    if (input.minEngagement !== undefined) {
      conditions.push(gte(creators.engagementRate, String(input.minEngagement)));
    }
    if (input.maxEngagement !== undefined) {
      conditions.push(lte(creators.engagementRate, String(input.maxEngagement)));
    }
    if (input.minGmv !== undefined) {
      conditions.push(gte(creators.gmv, String(input.minGmv)));
    }
    if (input.maxGmv !== undefined) {
      conditions.push(lte(creators.gmv, String(input.maxGmv)));
    }
    if (input.isTiktokShopCreator !== undefined) {
      conditions.push(eq(creators.isTiktokShopCreator, input.isTiktokShopCreator));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      followers: creators.followers,
      engagement_rate: creators.engagementRate,
      gmv: creators.gmv,
      created_at: creators.createdAt,
    }[input.sortBy];

    const orderFn = input.sortOrder === "desc" ? desc : asc;
    const offset = (input.page - 1) * input.pageSize;

    const [items, countResult] = await Promise.all([
      ctx.db
        .select()
        .from(creators)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(input.pageSize)
        .offset(offset),
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(creators)
        .where(where),
    ]);

    return {
      items,
      total: Number(countResult[0]?.count ?? 0),
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / input.pageSize),
    };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(creators)
        .where(eq(creators.id, input.id))
        .limit(1);

      return result[0] ?? null;
    }),
});
