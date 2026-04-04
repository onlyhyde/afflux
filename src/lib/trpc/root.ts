import { createTRPCRouter } from "./init";
import { creatorRouter } from "@/server/routers/creator";
import { creatorListRouter } from "@/server/routers/creator-list";
import { outreachRouter } from "@/server/routers/outreach";
import { crmRouter } from "@/server/routers/crm";
import { matchingRouter } from "@/server/routers/matching";
import { analyticsRouter } from "@/server/routers/analytics";
import { notificationRouter } from "@/server/routers/notification";
import { settingsRouter } from "@/server/routers/settings";

export const appRouter = createTRPCRouter({
  creator: creatorRouter,
  creatorList: creatorListRouter,
  outreach: outreachRouter,
  crm: crmRouter,
  matching: matchingRouter,
  analytics: analyticsRouter,
  notification: notificationRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
