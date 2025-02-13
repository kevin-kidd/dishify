"use client";

import { Text, Card, CardHeader, CardTitle, CardContent, Skeleton, Button } from "@dishify/ui";
import { View, RefreshControl, ScrollView } from "react-native";
import { useParams, useRouter } from "solito/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import * as Haptics from "expo-haptics";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorView } from "./error-view";
import { EmojiReactions } from "./emoji-reactions/index";
import { MarketplaceLinks } from "./marketplace-links";
import { FavoriteButton, ShareButton } from "./actions";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { formatPrice } from "app/utils/currency";

export default function RecipeCard() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : undefined;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: recipe,
    isLoading,
    error,
    isFetching,
    refetch,
  } = trpc.recipe.getRecipeBySlug.useQuery(
    { slug: slug as string },
    {
      enabled: !!slug,
      retry: (failureCount, error) => {
        // Don't retry on NOT_FOUND errors
        if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      meta: {
        skipErrorToast: true, // We'll handle errors ourselves
      },
    },
  );

  const recipeData = recipe;

  // Get cost estimate from marketplace API
  const {
    data: prices,
    isError: isPricesError,
    isLoading: isPricesLoading,
  } = trpc.marketplace.getMarketplacePrices.useQuery(
    {
      ingredients: recipeData?.data?.shoppingList ?? [],
      recipeId: recipeData?.id,
    },
    {
      enabled: !!recipeData?.data?.shoppingList?.length,
      staleTime: Number.POSITIVE_INFINITY, // Never mark the data as stale
      gcTime: Number.POSITIVE_INFINITY, // Keep the data cached indefinitely (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: (failureCount, error) => {
        // Only retry on TRPC errors that aren't NOT_FOUND, and max 2 times
        if (error instanceof TRPCClientError) {
          if (error.data?.code === "NOT_FOUND") {
            // Log the error but don't retry for no marketplaces
            console.warn(`No marketplaces found for region: ${error.message}`);
            return false;
          }
          return failureCount < 2;
        }
        return false;
      },
      meta: {
        skipErrorToast: true,
      },
    },
  );

  const costIndicators = useMemo(() => {
    let cost = 0;
    let currency = "USD";

    // If we have an error or no prices, try to use estimated cost from recipe data
    if (isPricesError || !prices?.prices) {
      const estimatedCost = recipeData?.estimatedCosts?.[prices?.region ?? "US"];
      if (estimatedCost?.cost) {
        cost = estimatedCost.cost;
      }
    } else {
      // Calculate total cost from lowest price for each ingredient
      cost = Object.values(prices.prices).reduce((sum, marketplacePrices) => {
        // Find the lowest price for this ingredient
        const lowestPrice = marketplacePrices.reduce(
          (min, price) => (price.price < min ? price.price : min),
          marketplacePrices[0]?.price ?? 0,
        );
        return sum + lowestPrice;
      }, 0);

      // Get the currency from the first marketplace price (they should all be the same for a region)
      currency = Object.values(prices.prices)[0]?.[0]?.currency ?? "USD";
    }

    // Calculate cost indicator based on total cost
    // Over $100 = 4 dollar signs ($10000 cents)
    // Over $50 = 3 dollar signs ($5000 cents)
    // Over $25 = 2 dollar signs ($2500 cents)
    // Under $25 = 1 dollar sign
    const count = cost > 10000 ? 4 : cost > 5000 ? 3 : cost > 2500 ? 2 : 1;

    return (
      <View className="flex flex-row items-center gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <DollarSign
            key={`cost-indicator-${crypto.randomUUID()}`}
            className="h-4 w-4 text-[#13a300]"
            strokeWidth={2.5}
          />
        ))}
        {cost > 0 && (
          <Text className="text-sm text-sage-600 ml-1">({formatPrice(cost, currency)})</Text>
        )}
      </View>
    );
  }, [prices?.prices, isPricesError, recipeData?.estimatedCosts, prices?.region]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle haptic feedback for status changes
  useEffect(() => {
    if (recipe?.status === "completed") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (recipe?.status === "error") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [recipe?.status]);

  // Show error state if query failed
  if (error) {
    return <ErrorView error={error} onRetry={refetch} onHome={() => router.push("/")} />;
  }

  // Show loading skeleton while loading or if recipe is being generated
  if (isLoading || (isFetching && !recipe)) {
    return <LoadingSkeleton />;
  }

  if (!recipe) {
    return null;
  }

  // Show error state if recipe generation failed
  if (recipe.status === "error") {
    return (
      <View className="flex h-full items-center justify-center p-4 my-6">
        <View className="flex items-center space-y-4">
          <Text className="text-2xl font-semibold">Failed to generate recipe</Text>
          <Text className="text-center text-gray-500 max-w-[350px]">
            {recipe.errorMessage || "Something went wrong while generating the recipe."}
          </Text>
          <View className="flex-row space-x-4">
            <Button onPress={() => router.push("/")}>
              <Text>Try Again</Text>
            </Button>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Retry Generation</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // Show loading state while recipe is being generated
  if (recipe.status === "generating") {
    return (
      <View className="flex h-full items-center justify-center p-4 my-6">
        <View className="flex items-center space-y-4">
          <LoadingSkeleton />
          <Text className="text-center text-gray-500">
            Generating your recipe... This may take a few moments.
          </Text>
        </View>
      </View>
    );
  }

  // Show completed recipe
  if (
    !recipe.data?.dishName ||
    !recipe.data?.cuisine ||
    !recipe.data?.shoppingList ||
    !recipe.data?.instructions
  ) {
    return (
      <View className="flex h-full items-center justify-center p-4 my-6">
        <View className="flex items-center space-y-4">
          <Text className="text-2xl font-semibold">Recipe data is incomplete</Text>
          <Text className="text-center text-gray-500 max-w-[350px]">
            The recipe data appears to be incomplete. Please try generating it again.
          </Text>
          <View className="flex-row space-x-4">
            <Button onPress={() => router.push("/")}>
              <Text>Try Again</Text>
            </Button>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Retry Loading</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const content = (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="mb-4 text-2xl">
          <Text>{recipe.name}</Text>
        </CardTitle>
        <View className="mb-4 flex flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="mb-4 text-lg font-medium">Cuisine: {recipe.data?.cuisine}</Text>
          </View>
          <View className="flex flex-row items-center gap-1.5">
            <ShareButton title={recipe.name} url={window.location.href} />
            <FavoriteButton recipe={recipe} />
          </View>
        </View>
        <View className="mb-4">
          <EmojiReactions slug={slug as string} />
        </View>
      </CardHeader>

      <CardContent>
        <Text className="mb-2 text-xl font-semibold">Shopping List</Text>
        <View className="mb-4">
          {recipe.data?.shoppingList.map((item) => (
            <View
              key={`${item.item}-${item.quantity}`}
              className="flex flex-row items-center justify-between border-b border-sage-50 py-3 last:border-0"
            >
              <View className="flex-1">
                <Text className="text-base text-sage-900">{item.quantity}</Text>
                <Text className="text-sm text-sage-600">{item.item}</Text>
              </View>
              <MarketplaceLinks prices={prices?.prices[item.item]} isLoading={isPricesLoading} />
            </View>
          ))}
        </View>

        <Text className="mb-2 text-xl font-semibold">Recipe</Text>
        <Text className="mb-2">Cooking Time: {recipe.data?.cookingTime}</Text>
        <Text className="mb-2">Servings: {recipe.data?.servings}</Text>
        <View className="mb-4 flex flex-row items-center gap-1">{costIndicators}</View>

        <Text className="mb-2 font-medium">Instructions:</Text>
        <View>
          {recipe.data?.instructions.map((instruction, index) => (
            <Text key={instruction.slice(0, 32)} className="mb-2 text-base">
              {index + 1}. {instruction}
            </Text>
          ))}
        </View>
      </CardContent>
    </Card>
  );

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      className="flex-1"
    >
      {content}
    </ScrollView>
  );
}
