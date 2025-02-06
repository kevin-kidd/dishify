import "server-only";

import type { AppRouter } from "@dishify/api/src/router";
import superjson from "superjson";
import { env } from "@dishify/app/utils/env";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { ssrPrepass } from "@trpc/next/ssrPrepass";

export const serverClient = createTRPCNext<AppRouter>({
  ssr: true,
  ssrPrepass,
  transformer: superjson,
  config(opts) {
    const { ctx } = opts;
    if (typeof window !== "undefined") {
      // during client requests
      return {
        links: [
          httpBatchLink({
            url: `${env.NEXT_PUBLIC_API_URL}/trpc`,
            transformer: superjson,
          }),
        ],
      };
    }
    return {
      links: [
        httpBatchLink({
          transformer: superjson,
          // The server needs to know your app's full url
          url: `${env.NEXT_PUBLIC_API_URL}/trpc`,

          /**
           * Set custom request headers on every request from tRPC
           * @see https://trpc.io/docs/v10/header
           */
          headers() {
            if (!ctx?.req?.headers) {
              return {};
            }
            // To use SSR properly, you need to forward client headers to the server
            // This is so you can pass through things like cookies when we're server-side rendering
            return {
              cookie: ctx.req.headers.cookie,
            };
          },
        }),
      ],
    };
  },
});
