import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";
import { getRecipe } from "./get";
import { toggleFavorite } from "./toggle-favorite";
import { recipeReactionsRouter } from "./reactions";

export const recipeRouter = router({
  generate,
  autocomplete,
  getRecipe,
  toggleFavorite,
  reactions: recipeReactionsRouter,
});

export type RecipeRouter = typeof recipeRouter;
