import { createTRPCRouter } from "./init";
import { creatorRouter } from "@/server/routers/creator";

export const appRouter = createTRPCRouter({
  creator: creatorRouter,
});

export type AppRouter = typeof appRouter;
