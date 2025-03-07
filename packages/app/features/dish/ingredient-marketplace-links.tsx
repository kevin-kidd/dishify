import React from "react";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import { MarketplaceLinks } from "./marketplace-links";

interface IngredientMarketplaceLinksProps {
  ingredient: string;
  quantity: string;
  recipeId?: string;
}

const queryOptions = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: (failureCount: number, error: unknown) => {
    if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
      console.warn(`No marketplaces found for region: ${error.message}`);
      return false;
    }
    return failureCount < 2;
  },
  meta: {
    skipErrorToast: true,
    noBatch: true,
  },
} as const;

export function IngredientMarketplaceLinks({
  ingredient,
  quantity,
  recipeId,
}: IngredientMarketplaceLinksProps) {
  const { data: priceData, isLoading } = trpc.marketplace.getIngredientPrice.useQuery(
    {
      ingredient,
      quantity,
      recipeId,
    },
    {
      ...queryOptions,
      suspense: false,
    },
  );

  return <MarketplaceLinks prices={priceData?.prices} isLoading={isLoading} />;
}
