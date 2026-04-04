import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { creatorRelationships, creators } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const crmRouter = createTRPCRouter({
  listByStage: publicProcedure
    .input(
      z.object({
        stage: z
          .enum(["discovered", "contacted", "negotiating", "active", "inactive"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.stage) {
        conditions.push(eq(creatorRelationships.stage, input.stage));
      }

      const results = await ctx.db
        .select({
          relationship: creatorRelationships,
          creator: creators,
        })
        .from(creatorRelationships)
        .innerJoin(creators, eq(creators.id, creatorRelationships.creatorId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(creatorRelationships.updatedAt))
        .limit(100);

      return results;
    }),

  updateStage: publicProcedure
    .input(
      z.object({
        relationshipId: z.string().uuid(),
        stage: z.enum([
          "discovered",
          "contacted",
          "negotiating",
          "active",
          "inactive",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(creatorRelationships)
        .set({
          stage: input.stage,
          updatedAt: new Date(),
        })
        .where(eq(creatorRelationships.id, input.relationshipId))
        .returning();

      return result[0];
    }),

  addNote: publicProcedure
    .input(
      z.object({
        relationshipId: z.string().uuid(),
        notes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(creatorRelationships)
        .set({
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(creatorRelationships.id, input.relationshipId))
        .returning();

      return result[0];
    }),

  updateTags: publicProcedure
    .input(
      z.object({
        relationshipId: z.string().uuid(),
        tags: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(creatorRelationships)
        .set({
          tags: input.tags,
          updatedAt: new Date(),
        })
        .where(eq(creatorRelationships.id, input.relationshipId))
        .returning();

      return result[0];
    }),
});
