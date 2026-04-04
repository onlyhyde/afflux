import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";

export interface TRPCContext {
  db: typeof db;
  tenantId: string | null;
  userId: string | null;
  locale: string;
}

export async function createTRPCContext(opts: {
  headers: Headers;
}): Promise<TRPCContext> {
  const locale = opts.headers.get("x-locale") ?? "en";

  // TODO: Extract tenantId and userId from auth session
  return {
    db,
    tenantId: null,
    userId: null,
    locale,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    },
  });
});
