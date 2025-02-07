import "server-only";

import type { AppRouter } from "@dishify/api/src/router";
import superjson from "superjson";
import { env } from "@dishify/app/utils/env";
import { httpBatchLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";
import { headers } from "next/headers";

// Server-side client - do not use hooks
export const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.NEXT_PUBLIC_API_URL}/trpc`,
      transformer: superjson,
      headers() {
        const heads = new Map(headers());
        return {
          // Forward cookies to maintain session state
          cookie: heads.get("cookie"),
          // Forward other relevant headers
          "user-agent": heads.get("user-agent"),
          authorization: heads.get("authorization"),
        };
      },
    }),
  ],
});
