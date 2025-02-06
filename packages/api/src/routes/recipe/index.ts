import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";
import { getRecipe, getRecipeBySlug } from "./get";
import { recipeFavoritesRouter } from "./favorites";
import { recipeReactionsRouter } from "./reactions";
import { trending } from "./trending";

export const recipeRouter = router({
  generate,
  autocomplete,
  getRecipe,
  getRecipeBySlug,
  favorites: recipeFavoritesRouter,
  reactions: recipeReactionsRouter,
  trending,
});

export type RecipeRouter = typeof recipeRouter;
