"use client";

import { Button, Card, Div, H2, P, Skeleton, Span, Text, cn } from "@dishify/ui/src";
import { Image, useWindowDimensions } from "react-native";
import { ArrowRight, Utensils } from "lucide-react-native";
import { trpc } from "@dishify/app/utils/trpc";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import { Clock } from "@dishify/ui/src/icons/clock";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { useRouter } from "solito/navigation";
import { Badge } from "@dishify/ui";
import { getCostIndicators } from "../../dish/cost-indicators";
import { Link } from "solito/link";

// Extended type for featured recipe with additional properties
type ExtendedFeaturedRecipe = {
  id: string;
  recipeId: string;
  slug: string;
  dishName: string;
  description: string;
  imageUrl: string;
  cuisine: RecipeResponse["cuisine"];
  difficulty: string;
  cookingTime: string;
  servings: string;
  keyIngredients: string[];
  createdAt: string;
  estimatedCosts?: any;
  category?: string;
  reactions?: Record<string, { count: number; hasReacted: boolean }>;
};

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
        <FeaturedRecipeCard
          featuredRecipe={featuredRecipe as ExtendedFeaturedRecipe}
          isMobile={isMobile}
        />
      )}
    </Div>
  );
}

function FeaturedRecipeCard({
  featuredRecipe,
  isMobile,
}: {
  featuredRecipe: ExtendedFeaturedRecipe;
  isMobile: boolean;
}) {
  // Ensure cuisine is one of the valid types for CuisineLabel
  const router = useRouter();
  const cuisine = featuredRecipe.cuisine as RecipeResponse["cuisine"];

  function handleCategoryClick() {
    if (featuredRecipe.category) {
      // Find category ID based on name
      const categoryId = categories.find((c) => c.name === featuredRecipe.category)?.id;
      if (categoryId) {
        router.push(`/category/${categoryId}`);
      }
    }
  }

  // Get cost indicators
  const costIndicators = featuredRecipe.estimatedCosts
    ? getCostIndicators(featuredRecipe.estimatedCosts)
    : null;

  // Get reactions
  const reactions = featuredRecipe.reactions || {};
  const sortedReactions = Object.entries(reactions)
    .filter(([_, data]) => data.count > 0)
    .map(([emoji, data]) => ({
      emoji,
      count: data.count,
    }))
    .slice(0, 3); // Show at most 3 reactions

  return (
    <Card
      className={cn(
        "w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg sm:mx-6",
        "transition-all duration-300 hover:shadow-xl",
      )}
    >
      <Div className={cn("flex w-full", isMobile ? "flex-col" : "flex-row")}>
        <Div className={cn("relative", isMobile ? "w-full aspect-video" : "w-2/5")}>
          <Div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-10" />
          <Image
            source={{ uri: featuredRecipe.imageUrl }}
            className="w-full h-full object-cover"
            style={{ maxHeight: isMobile ? undefined : 320 }}
            resizeMode="cover"
            accessibilityLabel={featuredRecipe.dishName}
          />
        </Div>

        <Div
          className={cn(
            "flex flex-col justify-between bg-white relative",
            isMobile ? "w-full p-5" : "w-3/5 p-6 my-2",
            isMobile ? "h-auto" : "h-72",
          )}
        >
          <Div className="flex flex-col">
            <H2 className="text-xl sm:text-2xl font-bold text-sage-900 mb-2">
              {featuredRecipe.dishName}
            </H2>

            <Div className="flex flex-row items-center flex-wrap gap-4 mb-3">
              <Div className="flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-sage-500" />
                <Span className="text-sm text-sage-600">{featuredRecipe.cookingTime}</Span>
              </Div>

              <Div className="flex flex-row items-center gap-2">
                <Utensils className="h-4 w-4 text-sage-500" />
                <Span className="text-sm text-sage-600">{featuredRecipe.servings} servings</Span>
              </Div>

              {costIndicators && (
                <Div className="flex flex-row items-center gap-1">{costIndicators}</Div>
              )}
            </Div>
          </Div>
          <Div className="flex flex-row items-center gap-2">
            <CuisineLabel cuisine={cuisine} />
            {featuredRecipe.category && (
              <Badge
                className={cn(
                  "hover:bg-sage-300 transition-colors sm:px-3 sm:py-1.5 py-1 px-2 text-xs font-medium",
                  "cursor-pointer bg-sage-200 text-sage-800",
                )}
                onPress={handleCategoryClick}
              >
                {featuredRecipe.category}
              </Badge>
            )}
          </Div>

          <P className="text-sage-700 text-sm sm:text-base py-0 my-3">
            {featuredRecipe.description}
          </P>

          {sortedReactions.length > 0 && (
            <Div className="flex flex-row items-center gap-2 absolute top-4 right-5">
              {sortedReactions.map(({ emoji, count }) => (
                <Div
                  key={emoji}
                  className="flex flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 border border-gray-200"
                >
                  <Text className="text-base">{emoji}</Text>
                  <Text className="text-sm font-medium text-gray-700">{count}</Text>
                </Div>
              ))}
            </Div>
          )}
          <Link href={`/dish/${featuredRecipe.slug}`}>
            <Button
              variant="default"
              className={cn(
                "flex flex-row items-center justify-center gap-2 w-fit px-6 py-3 cursor-pointer",
                "bg-sage-600 hover:bg-sage-700 transition-all ease-in-out duration-300",
                "rounded-full shadow-sm hover:shadow transform scale-100 hover:scale-105",
              )}
            >
              <P className="text-white font-medium">View Recipe</P>
              <ArrowRight className="w-4 h-4 text-white ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
            </Button>
          </Link>
        </Div>
      </Div>
    </Card>
  );
}

function FeaturedRecipeCardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className="w-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg sm:mx-6">
      <Div className={cn("flex w-full", isMobile ? "flex-col" : "flex-row")}>
        <Skeleton
          className={cn(isMobile ? "w-full aspect-video" : "w-2/5", "rounded-none")}
          style={{ height: isMobile ? undefined : 320 }}
        />

        <Div className={cn("flex flex-col justify-between", isMobile ? "w-full p-5" : "w-3/5 p-6")}>
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

// Categories data for navigation
const categories = [
  { id: "low-carb", name: "Low Carb" },
  { id: "vegetarian", name: "Vegetarian" },
  { id: "vegan", name: "Vegan" },
  { id: "gluten-free", name: "Gluten Free" },
  { id: "dairy-free", name: "Dairy Free" },
  { id: "quick-easy", name: "Quick & Easy" },
  { id: "one-pot", name: "One Pot" },
  { id: "budget-friendly", name: "Budget Friendly" },
  { id: "high-protein", name: "High Protein" },
  { id: "keto", name: "Keto" },
  { id: "paleo", name: "Paleo" },
  { id: "mediterranean", name: "Mediterranean" },
  { id: "kid-friendly", name: "Kid Friendly" },
  { id: "healthy", name: "Healthy" },
  { id: "comfort-food", name: "Comfort Food" },
  { id: "other", name: "Other" },
];
