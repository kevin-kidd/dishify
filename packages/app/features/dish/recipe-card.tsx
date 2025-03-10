"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
import { View } from "react-native";
import { useParams, useRouter } from "solito/navigation";
import { trpc } from "app/utils/trpc";
import { TRPCClientError } from "@trpc/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Text,
  Section,
  Badge,
  cn,
} from "@dishify/ui";
import Image from "next/image";
import { Clock } from "@dishify/ui/src/icons/clock";
import { Utensils } from "@dishify/ui/src/icons/utensils";
import { LoadingSkeleton } from "./loading-skeleton";
import { ErrorView } from "./error-view";
import { EmojiReactions } from "./emoji-reactions/index";
import { FavoriteButton, ShareButton, PrintButton } from "./actions";
import Animated, { FadeIn, FadeInDown, LinearTransition } from "react-native-reanimated";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import { useAtom } from "jotai";
import { favoritedRecipesAtom } from "app/atoms/favorites";
import { getCostIndicators } from "./cost-indicators";
import { IngredientMarketplaceLinks } from "./ingredient-marketplace-links";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { categories } from "@dishify/api/schemas/category";

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
  const isLocalStorage = slug ? slug.startsWith("local-") : false;

  // Get recipe from local storage if needed
  const [favoritedRecipes] = useAtom(favoritedRecipesAtom);
  const localRecipe = useMemo(
    () => (isLocalStorage && slug ? favoritedRecipes[slug.replace("local-", "")] : null),
    [favoritedRecipes, isLocalStorage, slug],
  );

  const {
    data: recipe,
    isLoading,
    error,
    refetch,
  } = trpc.recipe.getRecipeBySlug.useQuery(
    { slug: slug as string },
    {
      enabled: !!slug && !isLocalStorage,
      refetchInterval: (query) => {
        if (!query?.state?.data?.status) return false;
        // Refetch every second if the recipe is still generating or generating an image
        return ["generating", "generating_image"].includes(query.state.data.status) ? 1000 : false;
      },
      refetchIntervalInBackground: true,
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

  const generate = trpc.recipe.generate.useMutation({
    onSuccess: () => {
      void refetch().catch((error) => console.error(error));
    },
  });

  const recipeData = useMemo(() => localRecipe || recipe, [localRecipe, recipe]);

  // Get cost indicators from estimatedCosts
  const costIndicators = useMemo(() => {
    const indicators = getCostIndicators(recipeData?.estimatedCosts);
    if (indicators) return indicators;

    // Fallback: If no estimatedCosts, show a default indicator based on the number of ingredients
    if (recipeData?.data?.shoppingList) {
      const ingredientCount = recipeData.data.shoppingList.length;
      // Simple heuristic: more ingredients = higher cost
      const count =
        ingredientCount > 15 ? 4 : ingredientCount > 10 ? 3 : ingredientCount > 5 ? 2 : 1;

      return (
        <View className="flex flex-row items-center gap-1">
          {Array.from({ length: count }, (_, i) => (
            <DollarSign
              key={`fallback-${recipeData.id || "unknown"}-${i}`}
              className="h-4 w-4 text-[#13a300]"
              strokeWidth={2.5}
            />
          ))}
        </View>
      );
    }

    return null;
  }, [recipeData?.estimatedCosts, recipeData?.data?.shoppingList, recipeData?.id]);

  // Check if image is a valid URL or base64 data
  const hasValidImage = useMemo(() => {
    if (!recipeData?.imageUrl) return false;

    // Check if it's a base64 data URL
    if (recipeData.imageUrl.startsWith("data:image")) return true;

    // For absolute URLs, validate them
    if (recipeData.imageUrl.startsWith("http://") || recipeData.imageUrl.startsWith("https://")) {
      try {
        // Attempt to construct a URL object to validate the URL
        new URL(recipeData.imageUrl);
        return true;
      } catch (error) {
        // If URL constructor throws an error, the URL is invalid
        console.warn("Invalid image URL:", error);
        return false;
      }
    }

    // For relative URLs or other formats, assume they're valid
    // as they'll be processed by the image loader
    return true;
  }, [recipeData?.imageUrl]);

  const categoryId = useMemo(() => {
    return categories.find((c) => c.name === recipeData?.category)?.id;
  }, [recipeData?.category]);

  const handleCategoryClick = useCallback(() => {
    if (categoryId) {
      router.push(`/category/${categoryId}`);
    }
  }, [router, categoryId]);

  // Handle recipe status changes
  useEffect(() => {
    if (recipe?.status === "moved" && recipe?.movedToSlug) {
      router.replace(`/dish/${recipe.movedToSlug}`);
    }
  }, [recipe?.status, recipe?.movedToSlug, router]);

  const [imageLoaded, setImageLoaded] = useState(false);

  // Show loading state while recipe is being generated
  if (recipeData?.status === "generating" || isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error state if query failed
  if (error) {
    return (
      <ErrorView
        error={error}
        onRetry={() =>
          generate.mutateAsync({
            dishName: recipeData?.searchQuery || undefined,
            retryId: recipeData?.id,
          })
        }
        onHome={() => router.push("/")}
      />
    );
  }

  if (recipe?.status === "error") {
    console.error(recipe.errorMessage);
    return (
      <ErrorView
        error={new Error(recipe.errorMessage || "Failed to load dish")}
        onRetry={() =>
          generate.mutateAsync({
            dishName: recipeData?.searchQuery || undefined,
            retryId: recipeData?.id,
          })
        }
        onHome={() => router.push("/")}
      />
    );
  }

  // Use local recipe if available
  if (!recipeData && !error) {
    return (
      <ErrorView
        error={new Error("Failed to load dish")}
        onRetry={refetch}
        onHome={() => router.push("/")}
      />
    );
  }

  // Show completed recipe
  if (
    !recipeData?.data?.dishName ||
    !recipeData?.data?.cuisine ||
    !recipeData?.data?.shoppingList ||
    !recipeData?.data?.instructions
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

  const hasImage = hasValidImage;
  const hasCategory = !!recipeData.category;

  return (
    <Section className="max-w-6xl w-full mx-auto px-2 sm:px-4 pt-14">
      <Animated.View
        entering={FadeIn}
        layout={LinearTransition.springify().mass(0.8).damping(15).stiffness(100)}
        className="w-full"
      >
        <Card className="overflow-visible border-0 shadow-lg w-full">
          <CardHeader
            className={cn(
              "pt-7 pb-4 px-6 sm:pt-8 sm:pb-5 sm:px-10 border-b border-sage-100 relative",
              hasImage && "min-h-[240px] sm:min-h-[250px]",
            )}
          >
            {hasImage && (
              <View className="absolute inset-0 overflow-hidden rounded-t-lg">
                {/* Only show dark overlay and image when fully loaded */}
                {imageLoaded && recipeData.imageUrl && (
                  <>
                    <View className="absolute inset-0 bg-black/60 z-10 animate-in fade-in duration-300" />
                    <Image
                      width={1000}
                      height={1000}
                      src={recipeData.imageUrl}
                      alt={recipeData.data.dishName}
                      className="w-full h-full object-cover"
                      style={{ objectFit: "cover" }}
                      priority={true}
                    />
                  </>
                )}
                {/* Hidden image for preloading */}
                {recipeData.imageUrl && !imageLoaded && (
                  <Image
                    width={1000}
                    height={1000}
                    src={recipeData.imageUrl}
                    alt={recipeData.data.dishName}
                    className="opacity-0 absolute"
                    onLoad={() => setImageLoaded(true)}
                    priority={true}
                  />
                )}
              </View>
            )}

            <View className="absolute top-0 right-2 sm:top-2 sm:right-6 flex-row items-center gap-1 sm:gap-1.5">
              <PrintButton recipe={recipeData} />
              <ShareButton title={recipeData.name} url={window.location.href} />
              <FavoriteButton recipe={recipeData} />
            </View>

            <View
              className={cn(
                "flex flex-col relative z-20 h-full",
                imageLoaded && hasImage && recipeData.imageUrl ? "text-white" : "text-sage-900",
              )}
            >
              <CardTitle className="flex-1 min-w-0 mb-3">
                <Text
                  className={cn(
                    "text-2xl sm:text-4xl font-bold truncate block w-full",
                    imageLoaded && hasImage && recipeData.imageUrl ? "text-white" : "text-sage-900",
                  )}
                  numberOfLines={1}
                >
                  {toTitleCase(recipeData.data.dishName)}
                </Text>
              </CardTitle>

              <View className="flex flex-row items-center gap-2 mt-2">
                <View className="hidden sm:flex">
                  <CuisineLabel cuisine={recipeData.data.cuisine} />
                </View>

                {hasCategory && (
                  <Badge
                    className={cn(
                      "hidden sm:flex hover:bg-sage-200 transition-colors sm:px-3 sm:py-1.5 py-1 px-2 text-xs font-medium",
                      categoryId && "cursor-pointer",
                    )}
                    onPress={handleCategoryClick}
                  >
                    {recipeData.category}
                  </Badge>
                )}
              </View>

              {recipeData.description && (
                <Text
                  className={cn(
                    "mt-0 sm:mt-3 text-sm leading-relaxed w-full sm:w-1/2 lg:w-1/3 text-wrap",
                    imageLoaded && hasImage && recipeData.imageUrl
                      ? "text-white/90"
                      : "text-sage-600",
                  )}
                >
                  {recipeData.description}
                </Text>
              )}

              <View className="sm:hidden flex-1 flex-row items-center gap-2 w-full mt-3">
                <CuisineLabel cuisine={recipeData.data.cuisine} />
                {hasCategory && (
                  <Badge
                    className={cn(
                      "hover:bg-sage-200 transition-colors sm:px-3 sm:py-1.5 py-1 px-2 text-xs font-medium",
                      categoryId && "cursor-pointer",
                    )}
                    onPress={handleCategoryClick}
                  >
                    {recipeData.category}
                  </Badge>
                )}
              </View>

              <View className="mt-6 flex sm:flex-row gap-y-4 sm:items-center sm:justify-between flex-col w-full">
                <View className="flex flex-row items-center flex-wrap gap-4">
                  <View className="flex flex-row items-center gap-2">
                    <Clock
                      className={cn(
                        "h-4 w-4",
                        imageLoaded && hasImage && recipeData.imageUrl
                          ? "text-white/80"
                          : "text-sage-500",
                      )}
                    />
                    <Text
                      className={cn(
                        "text-sm",
                        imageLoaded && hasImage && recipeData.imageUrl
                          ? "text-white"
                          : "text-sage-500",
                      )}
                    >
                      {recipeData.data.cookingTime}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-2">
                    <Utensils
                      className={cn(
                        "h-4 w-4",
                        imageLoaded && hasImage && recipeData.imageUrl
                          ? "text-white/80"
                          : "text-sage-500",
                      )}
                    />
                    <Text
                      className={cn(
                        "text-sm",
                        imageLoaded && hasImage && recipeData.imageUrl
                          ? "text-white"
                          : "text-sage-500",
                      )}
                    >
                      {recipeData.data.servings} servings
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-1">{costIndicators}</View>
                </View>
                <View className="flex-shrink-0">
                  <EmojiReactions slug={recipeData.slug} />
                </View>
              </View>
            </View>
          </CardHeader>

          <CardContent className="grid gap-12 p-8 lg:grid-cols-[1fr_400px]">
            <View className="space-y-8">
              <Text className="mb-3 text-xl font-semibold text-sage-900">Instructions</Text>
              <View className="relative space-y-4">
                {recipeData.data.instructions.map((instruction, index) => (
                  <Animated.View
                    key={instruction.slice(0, 32)}
                    entering={FadeInDown.delay(index * 100)}
                    layout={LinearTransition.springify().mass(0.5).damping(15).stiffness(120)}
                    className="group relative"
                  >
                    {index < (recipeData.data?.instructions?.length ?? 0) - 1 && (
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
                        <Text className="text-sm leading-relaxed text-sage-800">{instruction}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>

            <View className="space-y-8">
              <View>
                <Text className="mb-6 text-xl font-semibold text-sage-900">Ingredients</Text>
                <View className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                  {recipeData.data.shoppingList.map((item) => (
                    <View
                      key={`${item.item}-${item.quantity}`}
                      className="flex sm:flex-row flex-col gap-y-4 sm:items-center sm:justify-between border-b border-sage-50 py-3 last:border-0"
                    >
                      <View className="flex-1 w-full">
                        <Text className="text-base text-sage-900">{item.quantity}</Text>
                        <Text className="text-sm text-sage-600">{item.item}</Text>
                      </View>
                      <IngredientMarketplaceLinks
                        ingredient={item.item}
                        quantity={item.quantity}
                        recipeId={recipeData.id}
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
