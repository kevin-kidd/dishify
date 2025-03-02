"use client";

import { Button, Card, Div, H2, P, Skeleton, Span } from "@dishify/ui/src";
import { Image, useWindowDimensions } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { trpc } from "@dishify/app/utils/trpc";
import { Link } from "solito/link";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import { Clock } from "@dishify/ui/src/icons/clock";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { useRouter } from "solito/navigation";

export function FeaturedRecipeSection() {
  const {
    data: featuredRecipe,
    isLoading,
    error,
  } = trpc.recipe.featured.useQuery(undefined, { meta: { skipErrorToast: true } });
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Always render the section with headings, conditionally render card content
  return (
    <Div className="pt-12 pb-8 w-full max-w-7xl mx-auto">
      <Div className="mb-8 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">Featured Recipe</H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">Handpicked dish you might love</P>
      </Div>

      {isLoading || error || !featuredRecipe ? (
        <FeaturedRecipeCardSkeleton isMobile={isMobile} />
      ) : (
        <FeaturedRecipeCard featuredRecipe={featuredRecipe} isMobile={isMobile} />
      )}
    </Div>
  );
}

function FeaturedRecipeCard({
  featuredRecipe,
  isMobile,
}: {
  featuredRecipe: any;
  isMobile: boolean;
}) {
  // Ensure cuisine is one of the valid types for CuisineLabel
  const router = useRouter();
  const cuisine = featuredRecipe.cuisine as RecipeResponse["cuisine"];
  function handleViewRecipe() {
    router.push(`/dish/${featuredRecipe.slug}`);
  }
  return (
    <Card className="w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg mx-4 sm:mx-6">
      <Div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full`}>
        <Div className={`${isMobile ? "w-full aspect-video" : "w-2/5"} relative`}>
          <Div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-10" />
          <Image
            source={{ uri: featuredRecipe.imageUrl }}
            className="w-full h-full object-cover"
            style={{ maxHeight: isMobile ? undefined : 320 }}
            resizeMode="cover"
            accessibilityLabel={featuredRecipe.dishName}
          />
          <Div className="absolute top-4 left-4 z-20">
            <CuisineLabel cuisine={cuisine} />
          </Div>
        </Div>

        <Div
          className={`${isMobile ? "w-full p-5" : "w-3/5 p-6"} flex flex-col justify-between h-64 bg-white my-2`}
        >
          <Div className="flex flex-col">
            <H2 className="text-xl sm:text-2xl font-bold text-sage-900 mb-0">
              {featuredRecipe.dishName}
            </H2>
            <Div className="flex flex-row items-center gap-2">
              <Clock className="h-4 w-4 text-sage-500" />
              <Span className="text-sm text-sage-600">{featuredRecipe.cookingTime}</Span>
              <Div className="h-1 w-1 rounded-full bg-sage-300 mx-2" />
              <Span className="text-sm text-sage-600">
                {featuredRecipe.difficulty} • {featuredRecipe.servings}
              </Span>
            </Div>
          </Div>

          <P className="text-sage-700 text-sm sm:text-base py-0 my-0">
            {featuredRecipe.description}
          </P>

          <Button
            onClick={handleViewRecipe}
            variant="default"
            className="flex flex-row items-center justify-center gap-2 w-fit px-6 py-3 bg-sage-600 hover:bg-sage-700 transition-all ease-in-out duration-300 rounded-full shadow-sm hover:shadow transform scale-100 hover:scale-105"
          >
            <P className="text-white font-medium">View Recipe</P>
            <ArrowRight className="w-4 h-4 text-white ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </Div>
      </Div>
    </Card>
  );
}

function FeaturedRecipeCardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className="w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg mx-4 sm:mx-6">
      <Div className={`flex ${isMobile ? "flex-col" : "flex-row"} w-full`}>
        <Skeleton
          className={`${isMobile ? "w-full aspect-video" : "w-2/5"} rounded-none`}
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
  );
}
