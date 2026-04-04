import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { appRouter } from "./root";
import { createTRPCContext } from "./init";

/**
 * Server-side tRPC caller for React Server Components.
 * Usage: const data = await serverTrpc.creator.list({ ... });
 */
const createContext = cache(async () => {
  const h = new Headers(await headers());
  h.set("x-trpc-source", "rsc");
  return createTRPCContext({ headers: h });
});

export const serverTrpc = appRouter.createCaller(createContext);
