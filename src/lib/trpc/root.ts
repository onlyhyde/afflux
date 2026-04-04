import { createTRPCRouter } from "./init";
import { creatorRouter } from "@/server/routers/creator";
import { outreachRouter } from "@/server/routers/outreach";
import { crmRouter } from "@/server/routers/crm";

export const appRouter = createTRPCRouter({
  creator: creatorRouter,
  outreach: outreachRouter,
  crm: crmRouter,
});

export type AppRouter = typeof appRouter;
