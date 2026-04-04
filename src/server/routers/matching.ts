import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { creators, products } from "@/lib/db/schema";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";
import {
  rankCreatorsForProduct,
  type ProductProfile,
  type CreatorProfile,
} from "@/lib/ai/matching-engine";
import { profileProduct } from "@/lib/ai/product-profiler";
import { generateMessage, type MessageGenerationInput } from "@/lib/ai/message-generator";

export const matchingRouter = createTRPCRouter({
  recommend: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // 1. Fetch product
      const product = await ctx.db
        .select()
        .from(products)
        .where(eq(products.id, input.productId))
        .limit(1);

      if (!product[0]) {
        return { matches: [], product: null };
      }

      const p = product[0];

      // 2. Profile product via AI
      const profile = profileProduct({
        name: p.name,
        category: p.category ?? "General",
        price: Number(p.price ?? 0),
        description: p.description,
        targetGender: p.targetGender,
        targetAgeMin: p.targetAgeMin,
        targetAgeMax: p.targetAgeMax,
      });

      // 3. Fetch candidate creators (active TikTok Shop creators)
      const candidateRows = await ctx.db
        .select()
        .from(creators)
        .where(
          and(
            eq(creators.isTiktokShopCreator, true),
            gte(creators.followers, 1000),
            isNotNull(creators.category)
          )
        )
        .orderBy(sql`${creators.gmv} DESC NULLS LAST`)
        .limit(500);

      // 4. Convert to CreatorProfile format
      const candidateProfiles: CreatorProfile[] = candidateRows.map((c) => ({
        id: c.id,
        username: c.username,
        displayName: c.displayName,
        category: c.category,
        followers: c.followers,
        engagementRate: Number(c.engagementRate ?? 0),
        gmv: Number(c.gmv ?? 0),
        trustScore: c.trustScore,
        country: c.country,
        language: c.language,
        contentStyles: c.contentStyles as string[] | null,
        audienceDemographics: c.audienceDemographics as CreatorProfile["audienceDemographics"],
        isTiktokShopCreator: c.isTiktokShopCreator ?? false,
        lastActiveAt: c.lastActiveAt,
      }));

      // 5. Run matching engine
      const productProfile: ProductProfile = {
        id: p.id,
        name: p.name,
        category: p.category ?? "General",
        price: Number(p.price ?? 0),
        currency: p.currency,
        targetGender: p.targetGender,
        targetAgeMin: p.targetAgeMin,
        targetAgeMax: p.targetAgeMax,
        targetKeywords: p.targetKeywords as string[] | undefined,
        description: p.description,
      };

      const matches = rankCreatorsForProduct(
        productProfile,
        candidateProfiles,
        input.limit
      );

      return {
        matches,
        product: {
          ...p,
          aiProfile: profile,
        },
      };
    }),

  profileProduct: publicProcedure
    .input(
      z.object({
        name: z.string(),
        category: z.string(),
        price: z.number(),
        description: z.string().optional(),
        targetGender: z.string().optional(),
        targetAgeMin: z.number().optional(),
        targetAgeMax: z.number().optional(),
      })
    )
    .query(({ input }) => {
      return profileProduct(input);
    }),

  generateMessage: publicProcedure
    .input(
      z.object({
        creatorName: z.string(),
        creatorCategory: z.string(),
        creatorUsername: z.string(),
        productName: z.string(),
        productDescription: z.string(),
        commissionRate: z.number(),
        brandName: z.string(),
        locale: z.string().default("en"),
        tone: z.enum(["formal", "casual", "friendly"]).default("friendly"),
        channel: z.enum(["tiktok_dm", "email", "tiktok_invite"]).default("tiktok_dm"),
      })
    )
    .mutation(({ input }) => {
      return generateMessage(input);
    }),
});
