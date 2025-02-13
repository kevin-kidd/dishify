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
import { Clock } from "@dishify/ui/src/icons/clock";
import { Utensils } from "@dishify/ui/src/icons/utensils";
import { formatPrice } from "app/utils/currency";

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

  const generate = trpc.recipe.generate.useMutation({
    onSuccess: () => {
      void refetch().catch((error) => console.error(error));
    },
  });

  function handleRetry() {
    if (recipeData) {
      generate.mutateAsync({
        dishName: recipeData.searchQuery || undefined,
        retryId: recipeData.id,
      });
    }
  }

  // Show loading state while recipe is being generated
  if (
    recipeData?.status === "generating" ||
    (recipe?.status === "moved" && recipe?.movedToSlug) ||
    isLoading
  ) {
    if (recipe?.status === "moved" && recipe?.movedToSlug) {
      router.replace(`/dish/${recipe.movedToSlug}`);
    }
    return <LoadingSkeleton />;
  }

  // Show error state if query failed
  if (error) {
    return <ErrorView error={error} onRetry={handleRetry} onHome={() => router.push("/")} />;
  }

  if (recipe?.status === "error") {
    console.error(recipe.errorMessage);
    return (
      <ErrorView
        error={new Error(recipe.errorMessage || "Failed to load dish")}
        onRetry={handleRetry}
        onHome={() => router.push("/")}
      />
    );
  }

  // Show completed recipe
  if (
    !recipe?.data?.dishName ||
    !recipe?.data?.cuisine ||
    !recipe?.data?.shoppingList ||
    !recipe?.data?.instructions
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
            <Button variant="outline" onPress={handleRetry}>
              <Text>Retry</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const content =
    recipe?.data && recipe.status === "completed" ? (
      <Card className="overflow-visible border-0 shadow-lg">
        <CardHeader className="pt-5 pb-3 px-6 border-b border-sage-100">
          <View className="flex flex-col">
            <View className="flex flex-row items-center justify-between w-full mb-3">
              <CardTitle className="flex-1 min-w-0">
                <Text
                  className="text-2xl font-bold text-sage-900 truncate block w-full"
                  numberOfLines={1}
                >
                  {toTitleCase(recipe.data.dishName)}
                </Text>
              </CardTitle>

              <View className="flex-row items-center gap-1.5">
                <ShareButton
                  title={recipe.name}
                  url={typeof window !== "undefined" ? window.location.href : ""}
                />
                <FavoriteButton recipe={recipe} />
              </View>
            </View>

            <View className="mt-6 flex flex-row items-center justify-between w-full">
              <View className="flex flex-row items-center flex-wrap gap-4">
                <View className="flex flex-row items-center gap-2">
                  <Clock className="h-4 w-4 text-sage-500" />
                  <Text className="text-sm">{recipe.data.cookingTime}</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <Utensils className="h-4 w-4 text-sage-500" />
                  <Text className="text-sm">{recipe.data.servings} servings</Text>
                </View>
                <View className="flex flex-row items-center gap-1">{costIndicators}</View>
              </View>
              <View className="flex-shrink-0">
                <EmojiReactions slug={recipe.slug} />
              </View>
            </View>
          </View>
        </CardHeader>

        <CardContent>
          <View className="space-y-8">
            <View>
              <Text className="mb-6 text-xl font-semibold text-sage-900">Instructions</Text>
              <View className="space-y-4">
                {recipe.data.instructions.map((instruction, index) => (
                  <View key={instruction.slice(0, 32)} className="flex flex-row items-start gap-4">
                    <View className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-sage-100">
                      <Text className="text-sm font-medium text-sage-600">{index + 1}</Text>
                    </View>
                    <View className="flex-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                      <Text className="text-sm leading-relaxed text-sage-800">{instruction}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Text className="mb-6 text-xl font-semibold text-sage-900">Ingredients</Text>
              <View className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                {recipe.data.shoppingList.map((item) => (
                  <View
                    key={`${item.item}-${item.quantity}`}
                    className="flex flex-row items-center justify-between border-b border-sage-50 py-3 last:border-0"
                  >
                    <View className="flex-1">
                      <Text className="text-base text-sage-900">{item.quantity}</Text>
                      <Text className="text-sm text-sage-600">{item.item}</Text>
                    </View>
                    <MarketplaceLinks
                      prices={prices?.prices[item.item]}
                      isLoading={isPricesLoading}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    ) : null;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      className="flex-1"
    >
      {content}
    </ScrollView>
  );
}
