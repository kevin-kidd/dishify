import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";
import { getRecipe, getRecipeBySlug } from "./get";
import { toggleFavorite } from "./toggle-favorite";
import { recipeReactionsRouter } from "./reactions";
import { trending } from "./trending";

export const recipeRouter = router({
  generate,
  autocomplete,
  getRecipe,
  getRecipeBySlug,
  toggleFavorite,
  reactions: recipeReactionsRouter,
  trending,
});

export type RecipeRouter = typeof recipeRouter;
