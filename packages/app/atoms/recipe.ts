import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { atomWithImmer } from "jotai-immer";

type RecipeState = {
  isLoading: boolean;
  data: RecipeResponse | null;
};

export const recipeAtom = atomWithImmer<RecipeState>({
  isLoading: false,
  data: null,
});
