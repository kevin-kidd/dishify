import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";
import { getRecipe, getRecipeBySlug } from "./get";
import { recipeFavoritesRouter } from "./favorites";
import { recipeReactionsRouter } from "./reactions";
import { trending } from "./trending";
import { getFeaturedRecipe } from "./featured";
import { getRecipesByCategory, getRecipesByCategoryCount } from "./category";

export const recipeRouter = router({
  generate,
  autocomplete,
  get: getRecipe,
  getRecipeBySlug,
  getRecipesByCategory,
  getRecipesByCategoryCount,
  favorites: recipeFavoritesRouter,
  reactions: recipeReactionsRouter,
  trending,
  featured: getFeaturedRecipe,
});

export type RecipeRouter = typeof recipeRouter;
