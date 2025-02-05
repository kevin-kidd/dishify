import "server-only";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@dishify/api/src/router";
import superjson from "superjson";
import { env } from "@dishify/app/utils/env";

export const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${env.NEXT_PUBLIC_API_URL}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
      headers: {
        "x-trpc-source": "server",
      },
    }),
  ],
});
