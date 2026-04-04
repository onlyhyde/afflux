import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface TRPCContext {
  db: typeof db;
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  locale: string;
  headers: Headers;
}

export async function createTRPCContext(opts: {
  headers: Headers;
}): Promise<TRPCContext> {
  const locale = opts.headers.get("x-locale") ?? "en";

  // Extract session from Better Auth
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    db,
    tenantId: (session?.user as { tenantId?: string })?.tenantId ?? null,
    userId: session?.user?.id ?? null,
    role: (session?.user as { role?: string })?.role ?? null,
    locale,
    headers: opts.headers,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
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

// Requires valid session with tenantId
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      role: ctx.role!,
    },
  });
});

// Requires owner role
export const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

// Requires owner or admin role (tenant-level admin)
export const tenantAdminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (!["owner", "admin"].includes(ctx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  }
);

// Requires owner, admin, or manager role
export const managerProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    if (!["owner", "admin", "manager"].includes(ctx.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  }
);
