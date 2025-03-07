import React from "react";
import { Image, View } from "react-native";
import { Card, Div, H2, P, Span, Text, cn } from "@dishify/ui/src";
import { Button, Badge } from "@dishify/ui";
import { Clock } from "@dishify/ui/src/icons/clock";
import { ArrowRight, Utensils } from "lucide-react-native";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";
import { useRouter } from "solito/navigation";
import { getCostIndicators } from "../../dish/cost-indicators";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";

interface RecipeCardProps {
  recipe: EnglishRecipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const recipeData = recipe.data as RecipeResponse;
  if (!recipeData) return null;

  function handleViewRecipe() {
    router.push(`/dish/${recipe.slug}`);
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
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
  };

  // Get cost indicators
  const costIndicators = recipe.estimatedCosts ? getCostIndicators(recipe.estimatedCosts) : null;
  return (
    <Card
      className={cn(
        "h-full overflow-hidden bg-white border-0 rounded-2xl shadow-lg",
        "hover:shadow-xl transition-all duration-300",
      )}
    >
      <Div className="flex flex-col h-full">
        <Div className="w-full aspect-video relative">
          <Div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent z-10" />
          <Image
            source={{ uri: recipe.imageUrl ?? undefined }}
            className="w-full h-full object-cover"
            resizeMode="cover"
            accessibilityLabel={recipeData.dishName}
          />
          <Div className="absolute top-4 left-4 z-20">
            <CuisineLabel cuisine={recipeData.cuisine} />
          </Div>
        </Div>

        <Div className="p-4 flex flex-col justify-between flex-1">
          <Div>
            <Div className="flex flex-row justify-between items-center mb-4">
              <H2 className="text-xl font-bold text-sage-900 py-0 my-0">{recipeData.dishName}</H2>
              <Span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  getDifficultyColor(recipeData.difficulty),
                )}
              >
                {recipeData.difficulty}
              </Span>
            </Div>

            <Div className="flex flex-row items-center flex-wrap gap-4 mb-3">
              <Div className="flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-sage-500" />
                <Span className="text-sm text-sage-600">{recipeData.cookingTime}</Span>
              </Div>

              <Div className="flex flex-row items-center gap-2">
                <Utensils className="h-4 w-4 text-sage-500" />
                <Span className="text-sm text-sage-600">{recipeData.servings} servings</Span>
              </Div>

              {costIndicators && (
                <Div className="flex flex-row items-center gap-1">{costIndicators}</Div>
              )}
            </Div>

            <P className="text-sage-700 text-sm line-clamp-2 min-h-[2.5rem]">
              {recipe.description}
            </P>
          </Div>

          <Button
            onClick={handleViewRecipe}
            variant="default"
            className={cn(
              "flex flex-row items-center justify-center gap-2 w-fit px-6 py-3",
              "bg-sage-600 hover:bg-sage-700 transition-all ease-in-out duration-300",
              "rounded-full shadow-sm hover:shadow transform scale-100 hover:scale-105 mt-2",
            )}
          >
            <P className="text-white font-medium">View Recipe</P>
            <ArrowRight className="w-4 h-4 text-white ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
          </Button>
        </Div>
      </Div>
    </Card>
  );
}
