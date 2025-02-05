import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@dishify/api/src/router";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RecipeOutput = RouterOutput["recipe"]["getRecipe"];

export type Recipe = {
  id: string;
  status: "generating" | "completed" | "error";
  errorMessage: string | null;
  searchQuery?: string | null;
  imageQuery?: "true" | null;
  dishName?: string;
  cuisine?: string;
  shoppingList?: Array<{
    item: string;
    quantity: string;
  }>;
  recipe?: {
    cookingTime: string;
    instructions: string[];
    servings: string;
  };
  updatedAt: string;
};

export interface RecipeCardProps {
  recipe: Recipe;
  isLoading: boolean;
  error: unknown;
  isFetching: boolean;
  refetch: () => Promise<void>;
}
