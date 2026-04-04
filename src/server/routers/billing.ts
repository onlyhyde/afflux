import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { subscriptions, billingEvents, tenants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getPlanLimits } from "@/server/services/plan-limits";

export const billingRouter = createTRPCRouter({
  getCurrentPlan: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) return null;

    const tenant = await ctx.db
      .select({ plan: tenants.plan })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    const plan = tenant[0]?.plan ?? "free";
    const limits = getPlanLimits(plan);

    const sub = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, ctx.tenantId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return {
      plan,
      limits,
      subscription: sub[0] ?? null,
    };
  }),

  getInvoices: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) return [];

      const offset = (input.page - 1) * input.pageSize;
      return ctx.db
        .select()
        .from(billingEvents)
        .where(eq(billingEvents.tenantId, ctx.tenantId))
        .orderBy(desc(billingEvents.createdAt))
        .limit(input.pageSize)
        .offset(offset);
    }),

  createCheckoutSession: publicProcedure
    .input(
      z.object({
        plan: z.enum(["starter", "growth"]),
        interval: z.enum(["month", "year"]).default("month"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Create Stripe Checkout Session
      // const session = await stripe.checkout.sessions.create({
      //   mode: 'subscription',
      //   customer: stripeCustomerId,
      //   line_items: [{ price: priceId, quantity: 1 }],
      //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=cancelled`,
      // });

      return {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=pending`,
        plan: input.plan,
        interval: input.interval,
      };
    }),

  createPortalSession: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Create Stripe Customer Portal Session
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: stripeCustomerId,
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    // });

    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    };
  }),
});
