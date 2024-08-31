import type { AppRouter } from "@dishify/api/src/router";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import superjson from "superjson";
import { getToken } from "../supabase/cookies";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          transformer: superjson,
          async headers() {
            return {
              Authorization: `Bearer ${getToken()}`,
            };
          },
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        }),
      ],
    };
  },
  transformer: superjson,
  ssr: false,
});
