"use client";

import { Text, Card, CardHeader, CardTitle, CardContent, Skeleton, Button } from "@dishify/ui";
import { View, RefreshControl, ScrollView } from "react-native";
import { useParams, useRouter } from "solito/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import * as Haptics from "expo-haptics";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorView } from "./error-view";
import { EmojiReactions } from "./emoji-reactions/index";
import { FavoriteButton, ShareButton } from "./actions";

export default function RecipeCard() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : undefined;
  const [refreshing, setRefreshing] = useState(false);
  const [reactions, setReactions] = useState<
    Array<{ emoji: string; count: number; hasReacted: boolean; timestamp?: number }>
  >([
    { emoji: "👍", count: 12, hasReacted: false, timestamp: Date.now() },
    { emoji: "🔥", count: 8, hasReacted: true, timestamp: Date.now() - 1000 },
    { emoji: "❤️", count: 5, hasReacted: false, timestamp: Date.now() - 2000 },
    { emoji: "😋", count: 0, hasReacted: false, timestamp: Date.now() - 3000 },
    { emoji: "🤤", count: 0, hasReacted: false, timestamp: Date.now() - 4000 },
    { emoji: "👎", count: 0, hasReacted: false, timestamp: Date.now() - 5000 },
  ]);

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

  const handleToggleReaction = useCallback((emoji: string) => {
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji === emoji
          ? { ...r, hasReacted: !r.hasReacted, count: r.count + (r.hasReacted ? -1 : 1) }
          : r,
      ),
    );
  }, []);

  const handleAddReaction = useCallback((emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        // If it exists but was not reacted to, toggle it
        if (!existing.hasReacted) {
          return prev.map((r) =>
            r.emoji === emoji
              ? { ...r, hasReacted: true, count: r.count + 1, timestamp: Date.now() }
              : r,
          );
        }
        return prev;
      }
      // If it's a new emoji, add it
      return [...prev, { emoji, count: 1, hasReacted: true, timestamp: Date.now() }];
    });
  }, []);

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
            <Text key={`${item.item}-${item.quantity}`} className="text-base">
              • {item.quantity} {item.item}
            </Text>
          ))}
        </View>

        <Text className="mb-2 text-xl font-semibold">Recipe</Text>
        <Text className="mb-2">Cooking Time: {recipe.data?.cookingTime}</Text>
        <Text className="mb-2">Servings: {recipe.data?.servings}</Text>

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
