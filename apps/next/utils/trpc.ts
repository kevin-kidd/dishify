import "server-only";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@dishify/api/src/router";
import superjson from "superjson";
import { headers } from "next/headers";
import { getToken } from "app/utils/supabase/cookies";

export const serverClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
      headers() {
        const heads = new Map(headers());
        heads.delete("connection");
        heads.set("x-trpc-source", "rsc");
        heads.set("Authorization", `Bearer ${getToken()}`);
        return Object.fromEntries(heads);
      },
    }),
  ],
});
