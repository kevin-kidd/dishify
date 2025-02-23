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
import { FavoriteButton, ShareButton } from "./actions";
import { Clock } from "@dishify/ui/src/icons/clock";
import { Utensils } from "@dishify/ui/src/icons/utensils";
import { IngredientPrices, useTotalCost } from "./ingredient-prices";

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
    refetch,
  } = trpc.recipe.getRecipeBySlug.useQuery(
    { slug: slug as string },
    {
      enabled: !!slug,
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError && error.data?.code === "NOT_FOUND") {
          return false;
        }
        return failureCount < 3;
      },
      meta: {
        skipErrorToast: true,
      },
    },
  );

  // Calculate total cost from individual ingredient prices
  const costData = useTotalCost(recipe?.data?.shoppingList, recipe?.id);

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

  const handleRetry = useCallback(() => {
    if (recipe) {
      void generate.mutateAsync({
        dishName: recipe.searchQuery || undefined,
        retryId: recipe.id,
      });
    }
  }, [generate, recipe]);

  // Handle recipe status changes
  useEffect(() => {
    if (recipe?.status === "moved" && recipe?.movedToSlug) {
      router.replace(`/dish/${recipe.movedToSlug}`);
    }
  }, [recipe?.status, recipe?.movedToSlug, router]);

  const content = useMemo(() => {
    if (!recipe?.data || recipe.status !== "completed") return null;

    const { data } = recipe;

    return (
      <Card className="overflow-visible border-0 shadow-lg">
        <CardHeader className="pt-5 pb-3 px-6 border-b border-sage-100">
          <View className="flex flex-col">
            <View className="flex flex-row items-center justify-between w-full mb-3">
              <CardTitle className="flex-1 min-w-0">
                <Text
                  className="text-2xl font-bold text-sage-900 truncate block w-full"
                  numberOfLines={1}
                >
                  {toTitleCase(data.dishName)}
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
                  <Text className="text-sm">{data.cookingTime}</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <Utensils className="h-4 w-4 text-sage-500" />
                  <Text className="text-sm">{data.servings} servings</Text>
                </View>
                <View className="flex flex-row items-center gap-1">{costData?.indicators}</View>
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
                {data.instructions.map((instruction, index) => (
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
                {data.shoppingList.map((item) => (
                  <View
                    key={`${item.item}-${item.quantity}`}
                    className="flex flex-col items-center justify-between border-b border-sage-50 py-3 last:border-0"
                  >
                    <View className="flex-1">
                      <Text className="text-base text-sage-900">{item.quantity}</Text>
                      <Text className="text-sm text-sage-600">{item.item}</Text>
                    </View>
                    <IngredientPrices
                      ingredient={item.item}
                      quantity={item.quantity}
                      recipeId={recipe.id}
                      shoppingList={data.shoppingList}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }, [recipe, costData?.indicators]);

  // Show loading state while recipe is being generated
  if (recipe?.status === "generating" || isLoading) {
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

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      className="flex-1"
    >
      {content}
    </ScrollView>
  );
}
