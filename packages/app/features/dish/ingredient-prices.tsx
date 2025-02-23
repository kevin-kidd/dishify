import type React from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { Text } from "@dishify/ui";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import { MarketplaceLinks } from "./marketplace-links";
import { formatPrice } from "app/utils/currency";
import { skipToken } from "@tanstack/react-query";

interface IngredientPricesProps {
  ingredient: string;
  quantity: string;
  recipeId?: string;
  shoppingList?: { item: string; quantity: string }[];
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
  },
} as const;

export function IngredientPrices({
  ingredient,
  quantity,
  recipeId,
  shoppingList,
}: IngredientPricesProps) {
  const { data: priceData, isLoading } = trpc.marketplace.getIngredientPrice.useQuery(
    {
      ingredient,
      quantity,
      recipeId,
      shoppingList,
    },
    queryOptions,
  );

  return <MarketplaceLinks prices={priceData?.prices} isLoading={isLoading} />;
}

export type TotalCostData = {
  indicators: React.ReactNode;
  cost: number;
  currency: string;
  loadedCount: number;
  totalCount: number;
} | null;

export function useTotalCost(
  shoppingList: { item: string; quantity: string }[] | null | undefined,
  recipeId?: string,
): TotalCostData {
  // Create a stable reference for the shopping list items
  const items = useMemo(() => {
    if (!shoppingList?.length) return [];
    return shoppingList.map((item) => ({
      ingredient: item.item,
      quantity: item.quantity,
      key: `${item.item}-${item.quantity}`,
    }));
  }, [shoppingList]);

  // Create a single query for the first item to get currency info
  const firstItemQuery = trpc.marketplace.getIngredientPrice.useQuery(
    items[0]
      ? {
          ingredient: items[0].ingredient,
          quantity: items[0].quantity,
          recipeId,
          shoppingList: items.map((item) => ({ item: item.ingredient, quantity: item.quantity })),
        }
      : skipToken,
    {
      ...queryOptions,
      enabled: items.length > 0,
    },
  );

  // Calculate total cost and indicators
  return useMemo(() => {
    if (!items.length || !firstItemQuery.data?.prices?.length) return null;

    const currency = firstItemQuery.data.prices[0]?.currency || "USD";
    const lowestPrice = firstItemQuery.data.prices.reduce(
      (min, price) => (price.price < min ? price.price : min),
      firstItemQuery.data.prices[0]?.price || 0,
    );

    // Estimate total cost based on first item
    const estimatedTotal = lowestPrice * items.length;
    const count =
      estimatedTotal > 10000 ? 4 : estimatedTotal > 5000 ? 3 : estimatedTotal > 2500 ? 2 : 1;

    // Create stable keys for dollar signs
    const dollarSigns = Array.from({ length: count }, (_, i) => `${estimatedTotal}-${i}`);

    return {
      indicators: (
        <View className="flex flex-row items-center gap-1">
          {dollarSigns.map((key) => (
            <DollarSign key={key} className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />
          ))}
          {estimatedTotal > 0 && (
            <Text className="text-sm text-sage-600 ml-1">
              (~{formatPrice(estimatedTotal, currency)})
            </Text>
          )}
        </View>
      ),
      cost: estimatedTotal,
      currency,
      loadedCount: firstItemQuery.data ? 1 : 0,
      totalCount: items.length,
    };
  }, [items, firstItemQuery.data]);
}
