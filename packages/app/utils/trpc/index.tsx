import type { AppRouter } from "@dishify/api/src/router";
import { createTRPCReact } from "@trpc/react-query";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { supabase } from "../supabase/client";
import { replaceLocalhost } from "./localhost.native";
import * as Burnt from "burnt";
import { parseErrorMessage } from "../helpers";

/**
 * A set of typesafe hooks for consuming the API.
 */
export const trpc = createTRPCReact<AppRouter>();

const getApiUrl = () => {
  const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}`;
  return replaceLocalhost(apiUrl);
};

export const TRPCProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          async headers() {
            const { data } = await supabase.auth.getSession();
            const token = data?.session?.access_token;
            return {
              Authorization: token ? `Bearer ${token}` : undefined,
            };
          },
          url: `${getApiUrl()}/trpc`,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
