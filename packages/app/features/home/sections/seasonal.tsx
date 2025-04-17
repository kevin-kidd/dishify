"use client";

import { useCallback } from "react";
import { Card, cn, Div, H2, P, Section } from "@dishify/ui/src";
import { Image, useWindowDimensions, View } from "react-native";
import { useRouter } from "solito/navigation";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { ArrowRight } from "lucide-react-native";
import { getCostIndicators } from "../../dish/cost-indicators";
import { trpc } from "../../../utils/trpc";
import { Skeleton } from "@dishify/ui/src/elements/skeleton";
import { Pressable } from "react-native";
import { Link } from "solito/link";

export function SeasonalSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const router = useRouter();

  // Fetch seasonal recipes from the API
  const { data, isLoading, error } = trpc.recipe.seasonal.useQuery(undefined, {
    meta: { skipErrorToast: true },
  });

  // Function to get color based on difficulty
  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500";
      case "Medium":
        return "text-yellow-500";
      case "Hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }, []);

  // Function to generate cost indicators
  const getCostDisplay = useCallback((estimatedCosts: any) => {
    // Use the shared getCostIndicators function
    return (
      getCostIndicators(estimatedCosts) || (
        // Fallback if getCostIndicators returns null
        <View className="flex flex-row items-center gap-1">
          <DollarSign className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />
        </View>
      )
    );
  }, []);

  // If loading, show skeleton UI
  if (isLoading) {
    return (
      <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
        <Div className="mb-4 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
            Seasonal Favorites
          </H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">Seasonal dishes to try now</P>
        </Div>

        <Div
          className={cn(
            "grid grid-cols-1",
            isMobile ? "" : "sm:grid-cols-2 md:grid-cols-3",
            "gap-6 sm:gap-8 px-4 sm:px-6",
          )}
        >
          {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
            <Card
              key={id}
              className="overflow-hidden border-0 rounded-xl shadow-md h-full flex flex-col"
            >
              <Skeleton className="aspect-video w-full" />
              <Div className="p-5 flex-1 flex flex-col">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-full mb-4" />
                <Div className="mt-auto">
                  <Div className="flex flex-row items-center justify-between mb-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </Div>
                  <Skeleton className="h-4 w-full mt-3" />
                </Div>
              </Div>
            </Card>
          ))}
        </Div>
      </Section>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
        <Div className="mb-4 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
            Seasonal Favorites
          </H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">
            Unable to load seasonal recipes. Please try again later.
          </P>
        </Div>
      </Section>
    );
  }

  // If data is not available, show loading state
  if (!data) {
    return (
      <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
        <Div className="mb-4 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
            Seasonal Favorites
          </H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">Loading seasonal recipes...</P>
        </Div>
      </Section>
    );
  }

  const { season, recipes, generatingRecipes = [] } = data;
  const seasonName = season.charAt(0).toUpperCase() + season.slice(1);

  // If we have no completed recipes and all are generating, show a more informative message
  if (recipes.length === 0 && generatingRecipes.length > 0) {
    return (
      <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
        <Div className="mb-4 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
            {seasonName} Favorites
          </H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">
            We're preparing some delicious {seasonName.toLowerCase()} recipes for you. Check back
            soon!
          </P>
        </Div>

        <Div
          className={cn(
            "grid grid-cols-1",
            isMobile ? "" : "sm:grid-cols-2 md:grid-cols-3",
            "gap-6 sm:gap-8 px-4 sm:px-6",
          )}
        >
          {generatingRecipes.map((recipeName) => (
            <Card
              key={`generating-${recipeName}`}
              className="overflow-hidden border-0 rounded-xl shadow-md h-full flex flex-col"
            >
              <Skeleton className="aspect-video w-full" />
              <Div className="p-5 flex-1 flex flex-col">
                <P className="font-semibold text-lg text-sage-900 mb-1">{recipeName}</P>
                <Skeleton className="h-4 w-full mb-4" />
                <Div className="mt-auto">
                  <Div className="flex flex-row items-center justify-between mb-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </Div>
                  <Div className="pt-3 border-t border-sage-100">
                    <P className="text-xs text-sage-500">Generating recipe...</P>
                  </Div>
                </Div>
              </Div>
            </Card>
          ))}
        </Div>
      </Section>
    );
  }

  return (
    <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
      <Div className="mb-4 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
          {seasonName} Favorites
        </H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">Seasonal dishes to try now</P>
      </Div>

      <Div
        className={cn(
          "grid grid-cols-1",
          isMobile ? "" : "sm:grid-cols-2 md:grid-cols-3",
          "gap-6 sm:gap-8 px-4 sm:px-6",
        )}
      >
        {recipes.map((recipe) => {
          // Use the imageUrl directly from the recipe data
          const imageUrl =
            recipe.imageUrl ||
            // Fallback image if no image is available
            "https://placehold.co/600x400/e2e8f0/64748b?text=Image+Coming+Soon";

          return (
            <Link href={`/dish/${recipe.slug}`} key={recipe.id}>
              <Pressable>
                <Card className="overflow-hidden border-0 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full flex flex-col group">
                  <Div className="aspect-video relative overflow-hidden">
                    <Div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10" />
                    <Image
                      source={{ uri: imageUrl }}
                      className="w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                      accessibilityLabel={recipe.name}
                      resizeMode="cover"
                    />
                  </Div>
                  <Div className="p-5 flex-1 flex flex-col">
                    <P className="font-semibold text-lg text-sage-900 mb-1 group-hover:text-sage-700 transition-colors duration-300">
                      {recipe.name}
                    </P>
                    <P className="text-sage-600 text-sm mb-4 group-hover:text-sage-500 transition-colors duration-300">
                      {recipe.description}
                    </P>

                    <Div className="mt-auto">
                      <Div className="flex flex-row items-center justify-between mb-3">
                        <Div className="flex flex-row items-center gap-2">
                          <Clock className="h-4 w-4 text-sage-500" />
                          <P className="text-xs text-sage-600">{recipe.cookingTime}</P>
                        </Div>

                        <Div className="flex flex-row items-center justify-end">
                          {recipe.estimatedCosts && getCostDisplay(recipe.estimatedCosts)}
                        </Div>
                      </Div>

                      <Div className="pt-3 border-t border-sage-100 flex flex-row items-center justify-between">
                        <P
                          className={`text-xs font-medium ${getDifficultyColor(
                            recipe.difficulty,
                          )} transition-all duration-300 group-hover:font-semibold`}
                        >
                          {recipe.difficulty}
                        </P>
                        <P className="text-xs text-sage-500 group-hover:text-sage-700 transition-colors duration-300 flex items-center">
                          Tap to view recipe
                          <ArrowRight className="w-3 h-3 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </P>
                      </Div>
                    </Div>
                  </Div>
                </Card>
              </Pressable>
            </Link>
          );
        })}

        {/* Show skeleton cards for recipes that are still generating */}
        {generatingRecipes.length > 0 &&
          generatingRecipes.map((recipeName) => (
            <Card
              key={`generating-${recipeName}`}
              className="overflow-hidden border-0 rounded-xl shadow-md h-full flex flex-col"
            >
              <Skeleton className="aspect-video w-full" />
              <Div className="p-5 flex-1 flex flex-col">
                <P className="font-semibold text-lg text-sage-900 mb-1">{recipeName}</P>
                <Skeleton className="h-4 w-full mb-4" />
                <Div className="mt-auto">
                  <Div className="flex flex-row items-center justify-between mb-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </Div>
                  <Div className="pt-3 border-t border-sage-100">
                    <P className="text-xs text-sage-500">Generating recipe...</P>
                  </Div>
                </Div>
              </Div>
            </Card>
          ))}
      </Div>
    </Section>
  );
}
