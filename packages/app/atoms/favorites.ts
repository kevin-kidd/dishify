import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";
import { atomWithStorage } from "./storage/storage";

/**
 * Atom for storing favorited recipes.
 * Uses localStorage on web and MMKV on native.
 */
export const favoritedRecipesAtom = atomWithStorage<Record<string, EnglishRecipe>>(
  "favorited-recipes",
  {},
);
