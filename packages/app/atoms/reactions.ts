import { atomWithStorage } from "./storage/storage";

export interface ReactionState {
  emoji: string;
  count: number;
  hasReacted: boolean;
  timestamp: number;
}

export interface RecipeReactions {
  [recipeId: string]: ReactionState[];
}

/**
 * Atom for storing recipe reactions.
 * Uses localStorage on web and MMKV on native.
 */
export const recipeReactionsAtom = atomWithStorage<RecipeReactions>("recipe-reactions", {});
