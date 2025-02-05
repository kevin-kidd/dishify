"use client";

import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { useParams, useRouter } from "solito/navigation";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import { Card, CardHeader, CardTitle, CardContent, Button, Text, Section } from "@dishify/ui";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { Utensils } from "@dishify/ui/src/icons/utensils";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorView } from "./error-view";
import { EmojiReactions } from "./emoji-reactions/index";
import { MarketplaceLinks } from "./marketplace-links";
import { FavoriteButton, ShareButton, PrintButton } from "./actions";
import { toast } from "app/utils/toast";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";

// Mock data for demo - replace with real data from API
const MOCK_MARKETPLACES = [
  {
    name: "Walmart",
    logo: "https://logo.clearbit.com/walmart.com",
    price: 3.99,
    url: "https://walmart.com",
  },
  {
    name: "Amazon",
    logo: "https://logo.clearbit.com/amazon.com",
    price: 4.99,
    url: "https://amazon.com",
  },
  {
    name: "Target",
    logo: "https://logo.clearbit.com/target.com",
    price: 4.49,
    url: "https://target.com",
  },
];

// Example of single marketplace
const MOCK_SINGLE_MARKETPLACE = [
  {
    name: "Walmart",
    logo: "https://logo.clearbit.com/walmart.com",
    price: 3.99,
    url: "https://walmart.com",
  },
];

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function RecipeCard() {
  const router = useRouter();
  const { recipeId } = useParams();

  const {
    data: recipe,
    isLoading,
    error,
    refetch,
  } = trpc.recipe.getRecipe.useQuery(
    { id: recipeId as string },
    {
      enabled: !!recipeId,
      // Poll every second while recipe is generating
      refetchInterval: (query) => {
        if (!query?.state?.data?.status) return false;
        return query.state.data.status === "generating" ? 1000 : false;
      },
      // Keep polling even if the window is in the background
      refetchIntervalInBackground: true,
      // Don't stop polling on error
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

  const generate = trpc.recipe.generate.useMutation({
    onSuccess: () => {
      void refetch().catch((error) => console.error(error));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const costIndicators = useMemo(() => {
    // Default to 1 dollar sign if no cost is provided
    const cost = 150; // TODO: Replace with actual cost calculation from API
    const count = cost > 250 ? 4 : cost > 150 ? 3 : cost > 50 ? 2 : 1;
    return (
      <View className="flex flex-row items-center gap-1">
        {Array.from({ length: count }).map((_, i) => (
          <DollarSign
            key={`cost-indicator-${crypto.randomUUID()}`}
            className="h-4 w-4 text-[#13a300]"
            strokeWidth={2.5}
          />
        ))}
      </View>
    );
  }, []);

  // Show error state if query failed
  if (error) {
    return <ErrorView error={error} onRetry={refetch} onHome={() => router.push("/")} />;
  }

  // Show loading skeleton while loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!recipe) {
    return null;
  }

  if (recipe.status === "moved" && recipe.movedToRecipeId) {
    router.replace(`/dish/${recipe.movedToRecipeId}`);
    return <LoadingSkeleton />;
  }

  // Show error state if recipe generation failed
  if (recipe.status === "error") {
    const isImageRecipe = recipe.imageQuery === "true";
    return (
      <View className="flex h-full items-center justify-center p-4 my-6">
        <View className="flex items-center space-y-4">
          <Text className="text-2xl font-semibold">Failed to generate recipe</Text>
          <Text className="text-center text-gray-500 max-w-[350px]">
            {recipe.errorMessage || "Something went wrong while generating the recipe."}
          </Text>
          <View className="flex-row space-x-4">
            {!isImageRecipe && (
              <Button
                onClick={() =>
                  generate.mutateAsync({
                    dishName: recipe?.searchQuery || undefined,
                    retryId: recipeId as string,
                  })
                }
                disabled={generate.isPending}
              >
                <Text>{generate.isPending ? "Retrying..." : "Retry"}</Text>
              </Button>
            )}
          </View>
          {isImageRecipe && (
            <Text className="text-center text-gray-400 text-sm">
              Please upload the image again to retry.
            </Text>
          )}
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
          <Text className="text-center text-gray-400 text-sm">
            The page will automatically update when the recipe is ready.
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
            <Button onClick={() => router.push("/")}>
              <Text>Try Again</Text>
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <Text>Retry</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Section className="max-w-6xl mx-auto px-4 pt-14 pb-10">
      <Animated.View
        entering={FadeIn}
        layout={LinearTransition.springify().mass(0.8).damping(15).stiffness(100)}
      >
        <Card className="overflow-visible border-0 shadow-lg">
          <CardHeader className="pt-8 pb-5 px-10 border-b border-sage-100">
            <View className="flex flex-col">
              <View className="flex flex-row items-center justify-between w-full mb-3">
                <View className="flex-1 min-w-0">
                  <CardTitle>
                    <Text className="text-4xl font-bold tracking-tight text-sage-900 truncate">
                      {toTitleCase(recipe.name)}
                    </Text>
                  </CardTitle>
                </View>
                <View className="flex flex-row items-center gap-1.5">
                  <PrintButton recipe={recipe} />
                  <ShareButton title={recipe.name} url={window.location.href} />
                  <FavoriteButton recipe={recipe} />
                </View>
              </View>
              <CuisineLabel cuisine={recipe.data.cuisine} />
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
                  <EmojiReactions recipeId={recipeId as string} />
                </View>
              </View>
            </View>
          </CardHeader>

          <CardContent className="grid gap-12 p-8 lg:grid-cols-[1fr_300px]">
            <View className="space-y-8">
              <View>
                <Text className="mb-6 text-xl font-semibold text-sage-900">Instructions</Text>
                <View className="relative space-y-4">
                  {recipe.data.instructions.map((instruction, index) => (
                    <Animated.View
                      key={instruction.slice(0, 32)}
                      entering={FadeInDown.delay(index * 100)}
                      layout={LinearTransition.springify().mass(0.5).damping(15).stiffness(120)}
                      className="group relative"
                    >
                      {index < (recipe.data?.instructions?.length ?? 0) - 1 && (
                        <View className="absolute left-[13.5px] top-[31px] h-[calc(100%+8px)] w-0.5 bg-sage-100 group-hover:bg-sage-200 transition-colors duration-200" />
                      )}
                      <View className="flex flex-row items-start gap-6">
                        <View className="relative flex flex-col items-center pt-1.5 w-7">
                          <View className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-sage-100 group-hover:ring-sage-200 transition-all duration-200">
                            <Text className="text-sm font-medium text-sage-600 group-hover:text-sage-700 transition-colors duration-200">
                              {index + 1}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100 hover:ring-sage-200 transition-all duration-200">
                          <Text className="text-base leading-relaxed text-sage-800">
                            {instruction}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>

            <View className="space-y-8">
              <View>
                <Text className="mb-6 text-xl font-semibold text-sage-900">Ingredients</Text>
                <View className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                  {recipe.data.shoppingList.map((item, index) => (
                    <View
                      key={`${item.item}-${item.quantity}`}
                      className="flex flex-row items-center justify-between border-b border-sage-50 py-3 last:border-0"
                    >
                      <View className="flex-1">
                        <Text className="text-base text-sage-900">{item.quantity}</Text>
                        <Text className="text-sm text-sage-600">{item.item}</Text>
                      </View>
                      <MarketplaceLinks
                        ingredient={item.item}
                        marketplaces={index === 0 ? MOCK_SINGLE_MARKETPLACE : MOCK_MARKETPLACES}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </Animated.View>
    </Section>
  );
}
