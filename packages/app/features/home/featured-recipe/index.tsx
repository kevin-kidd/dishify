"use client";

import { useEffect, useState } from "react";
import { Button, Card, Div, H2, P, Skeleton } from "@dishify/ui/src";
import { Image, useWindowDimensions } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { trpc } from "@dishify/app/utils/trpc";
import { Link } from "solito/link";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import { Clock } from "@dishify/ui/src/icons/clock";
import type { TrendingRecipe } from "@dishify/api/src/routes/recipe/trending";
import { getFoodImageUrl } from "@dishify/app/utils/food-images";

export function FeaturedRecipeSection() {
  const { data: trendingRecipes, isLoading } = trpc.recipe.trending.useQuery();
  const [featuredRecipe, setFeaturedRecipe] = useState<TrendingRecipe | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Select the first trending recipe with highest score as featured
  useEffect(() => {
    if (trendingRecipes && trendingRecipes.length > 0) {
      // Sort by trending score and take the first one
      const topRecipes = [...trendingRecipes].sort((a, b) => b.trendingScore - a.trendingScore);
      const topRecipe = topRecipes[0];
      setFeaturedRecipe(topRecipe as TrendingRecipe);
    }
  }, [trendingRecipes]);

  if (isLoading) {
    return <FeaturedRecipeSkeleton />;
  }

  if (!featuredRecipe) {
    return null;
  }

  const recipeData = featuredRecipe.data;

  // Get an appropriate image for this specific dish/cuisine
  const imageUrl = getFoodImageUrl(recipeData.dishName, recipeData.cuisine);

  return (
    <Div className="py-12 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <Div className="mb-8 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900">Featured Recipe</H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">Handpicked dish you might love</P>
      </Div>

      <Card className="w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg mx-4 sm:mx-6">
        <Div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full`}>
          <Div className={`${isMobile ? "w-full aspect-video" : "w-2/5"} relative`}>
            <Div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-10" />
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full object-cover"
              style={{ maxHeight: isMobile ? undefined : 320 }}
              resizeMode="cover"
              accessibilityLabel={recipeData.dishName}
            />
            <Div className="absolute top-4 left-4 z-20">
              <CuisineLabel cuisine={recipeData.cuisine} />
            </Div>
          </Div>

          <Div
            className={`${isMobile ? "w-full p-5" : "w-3/5 p-6"} flex flex-col justify-between bg-white`}
          >
            <Div>
              <H2 className="text-xl sm:text-2xl font-bold text-sage-900 mb-2">
                {recipeData.dishName}
              </H2>

              <Div className="flex flex-row items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-sage-500" />
                <P className="text-sm text-sage-600">{recipeData.cookingTime}</P>
                <Div className="h-1 w-1 rounded-full bg-sage-300 mx-2" />
                <P className="text-sm text-sage-600">
                  {recipeData.difficulty} • {recipeData.servings}
                </P>
              </Div>

              <P className="text-sage-700 mb-6 text-sm sm:text-base leading-relaxed">
                {generateDescriptionFromRecipe(recipeData)}
              </P>
            </Div>

            <Link href={`/dish/${featuredRecipe.slug}`}>
              <Button
                variant="default"
                className="flex flex-row items-center justify-center gap-2 w-fit px-6 py-3 bg-sage-600 hover:bg-sage-700 transition-all duration-300 rounded-full shadow-sm hover:shadow transform hover:scale-105"
              >
                <P className="text-white font-medium">View Recipe</P>
                <ArrowRight className="w-4 h-4 text-white ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </Div>
        </Div>
      </Card>
    </Div>
  );
}

function FeaturedRecipeSkeleton() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Div className="py-12 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <Div className="mb-8 px-4 sm:px-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-5 w-64 mt-2 rounded-lg" />
      </Div>

      <Card className="w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg mx-4 sm:mx-6">
        <Div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full`}>
          <Skeleton
            className={`${isMobile ? "w-full aspect-video" : "w-2/5"}`}
            style={{ height: isMobile ? undefined : 320 }}
          />

          <Div className={`${isMobile ? "w-full p-5" : "w-3/5 p-6"} flex flex-col justify-between`}>
            <Div>
              <Skeleton className="h-8 w-3/4 rounded-lg mb-3" />
              <Skeleton className="h-4 w-1/2 rounded-lg mb-3" />
              <Skeleton className="h-4 w-full rounded-lg mb-2" />
              <Skeleton className="h-4 w-full rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4 rounded-lg mb-4" />
            </Div>

            <Skeleton className="h-12 w-40 rounded-lg" />
          </Div>
        </Div>
      </Card>
    </Div>
  );
}

function generateDescriptionFromRecipe(recipeData: TrendingRecipe["data"]) {
  // Create a tempting description based on available recipe data
  const ingredients = recipeData.shoppingList.slice(0, 3).map((item) => item.item);

  if (ingredients.length === 0) {
    return `A delicious ${recipeData.cuisine} dish that's perfect for any occasion. This ${recipeData.difficulty.toLowerCase()} recipe is ready in ${recipeData.cookingTime}.`;
  }

  const ingredientText =
    ingredients.length > 1
      ? `${ingredients.slice(0, -1).join(", ")} and ${ingredients[ingredients.length - 1]}`
      : ingredients[0];

  return `A mouthwatering ${recipeData.cuisine} dish featuring ${ingredientText}. This ${recipeData.difficulty.toLowerCase()} recipe is ready in ${recipeData.cookingTime} and serves ${recipeData.servings}.`;
}
