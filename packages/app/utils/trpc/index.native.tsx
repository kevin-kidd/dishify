import type { AppRouter } from "@dishify/api/src/router";
import { createTRPCReact } from "@trpc/react-query";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { replaceLocalhost } from "./localhost.native";
import { parseErrorMessage } from "../helpers";
import { toast } from "../toast";
import { authClient } from "../auth/client.native";

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
            // Skip toast if query has custom error handling
            if (query.meta?.skipErrorToast) return;
            // Skip toast if query explicitly disabled it
            if (query.meta?.showToastOnError === false) return;

            toast.error("Error", {
              description: parseErrorMessage(error),
              duration: 10000,
            });
          },
        }),
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: `${getApiUrl()}/trpc`,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
          headers: {
            "x-trpc-source": "react-native",
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
