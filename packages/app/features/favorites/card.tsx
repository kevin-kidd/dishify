import { Card, Text } from "@dishify/ui/src";
import { ChevronRight } from "@dishify/ui/src/icons/chevron-right";
import { Clock } from "@dishify/ui/src/icons/clock";
import { View } from "react-native";
import { Link } from "solito/link";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { FavoriteButton } from "app/features/dish/actions/favorite-button";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";
import { useRouter } from "solito/navigation";

interface FavoriteCardProps {
  recipe: RecipeResponse & {
    id: string;
    slug: string;
    status: "error" | "generating" | "completed" | "moved";
  };
}

export function FavoriteCard({ recipe }: FavoriteCardProps) {
  const router = useRouter();
  const getDifficultyColor = (difficulty: RecipeResponse["difficulty"]) => {
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

  // Convert recipe to EnglishRecipe format for FavoriteButton
  const englishRecipe: EnglishRecipe = {
    id: recipe.id,
    slug: recipe.slug,
    status: recipe.status,
    name: recipe.dishName,
    data: {
      dishName: recipe.dishName,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      shoppingList: recipe.shoppingList,
      instructions: recipe.instructions,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    movedToRecipeId: null,
    movedToSlug: null,
    errorMessage: null,
    searchQuery: null,
    imageQuery: null,
    ratings: null,
    estimatedCosts: null,
  };

  return (
    <Link href={`/dish/${recipe.slug}`}>
      <Card
        className="w-full h-52 group items-start relative overflow-visible rounded-xl border-0 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] cursor-pointer"
        aria-label={`View recipe for ${recipe.dishName}`}
      >
        <div className="absolute right-4 top-4 flex gap-2">
          <FavoriteButton recipe={englishRecipe} stopPropagation />
          <ChevronRight className="h-5 w-5 text-primary/80 transition-transform duration-300 group-hover:translate-x-1" />
        </div>

        <View className="flex flex-col gap-2 h-[60%]">
          <h3 className="text-xl font-semibold tracking-tight select-none">{recipe.dishName}</h3>
          <CuisineLabel cuisine={recipe.cuisine} />
        </View>

        <div className="grid grid-cols-2 w-full h-[40%]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/80" />
            <span className="text-sm text-gray-600 select-none">{recipe.cookingTime}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3 w-full">
          <span
            className={`text-sm font-medium ${getDifficultyColor(recipe.difficulty)} select-none`}
          >
            {recipe.difficulty}
          </span>
          <span className="text-xs text-primary/80 select-none">Tap to view recipe</span>
        </div>
      </Card>
    </Link>
  );
}
