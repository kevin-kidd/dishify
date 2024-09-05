"use client";

import type { AppRouter } from "@dishify/api/src/router";
import superjson from "superjson";
import { getToken } from "../supabase/cookies";
import { useState } from "react";
import { createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import * as Burnt from "burnt";
import { parseErrorMessage } from "../helpers";

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.showToastOnError) {
          return;
        }
        Burnt.toast({
          title: "Error",
          preset: "error",
          message: parseErrorMessage(error),
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = makeQueryClient();
  }
  return clientQueryClientSingleton;
}

export function TRPCProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          transformer: superjson,
          headers() {
            return {
              Authorization: `Bearer ${getToken()}`,
            };
          },
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </trpc.Provider>
  );
}
