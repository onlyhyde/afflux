import { createTRPCRouter } from "./init";
import { creatorRouter } from "@/server/routers/creator";
import { outreachRouter } from "@/server/routers/outreach";

export const appRouter = createTRPCRouter({
  creator: creatorRouter,
  outreach: outreachRouter,
});

export type AppRouter = typeof appRouter;
