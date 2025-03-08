import { count, desc, eq, sql } from "drizzle-orm";
import {
  EnglishRecipesTable,
  FeaturedRecipeTable,
  RecipeReactionsTable,
  type FeaturedRecipe,
  type EnglishRecipe,
} from "../db/schema/recipes";
import { tryCatch } from "@dishify/app/utils/helpers";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import type { Bindings } from "../types";

const CACHE_KEY = "featured-recipe";
const CACHE_TTL = 86400; // 24 hours in seconds
const FEATURED_RECIPE_STATE_PREFIX = "featured_recipe_state:";
const POSITIVE_EMOJIS = ["👍", "❤️", "🔥", "😋", "😍"];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type FeaturedRecipeResponse = {
  id: string;
  recipeId: string;
};

/**
 * Generates a featured recipe in the background via queue processing
 */
export async function generateFeaturedRecipe(
  env: Bindings,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
): Promise<void> {
  const startTime = Date.now();
  const recipeState = env.RECIPE_STATE;

  try {
    await recipeState.put(`${FEATURED_RECIPE_STATE_PREFIX}generating`, "true", {
      expirationTtl: 300,
    });

    const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString();

    const { data: recipeReactions, error: reactionsError } = await tryCatch(
      db
        .select({
          recipeId: RecipeReactionsTable.recipeId,
          reactionCount: count(),
        })
        .from(RecipeReactionsTable)
        .where(
          sql`${RecipeReactionsTable.createdAt} >= ${yesterday} AND ${RecipeReactionsTable.emoji} IN (${POSITIVE_EMOJIS.join(", ")})`,
        )
        .groupBy(RecipeReactionsTable.recipeId)
        .orderBy(desc(sql`reactionCount`))
        .limit(10)
        .all(),
    );

    let selectedRecipeId: string | null = null;

    if (
      recipeReactions &&
      Array.isArray(recipeReactions) &&
      recipeReactions.length > 0 &&
      !reactionsError
    ) {
      const topReaction = recipeReactions[0] as { recipeId: string; reactionCount: number };
      selectedRecipeId = topReaction.recipeId;
    } else {
      const { data: randomRecipe, error: randomError } = await tryCatch(
        db
          .select()
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.status, "completed"))
          .orderBy(sql`RANDOM()`)
          .limit(1)
          .get(),
      );

      if (randomRecipe && !randomError) {
        const typedRandomRecipe = randomRecipe as EnglishRecipe;
        selectedRecipeId = typedRandomRecipe.id;
      } else {
        throw new Error("Failed to select a random recipe");
      }
    }

    if (!selectedRecipeId) {
      throw new Error("Failed to select a recipe for featuring");
    }

    const { data: newFeaturedRecipe, error: insertError } = await tryCatch(
      db
        .insert(FeaturedRecipeTable)
        .values({
          recipeId: selectedRecipeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning()
        .get(),
    );

    if (!newFeaturedRecipe || insertError) {
      throw new Error(`Failed to insert featured recipe: ${insertError?.message}`);
    }

    const typedNewFeaturedRecipe = newFeaturedRecipe as FeaturedRecipe;

    const response: FeaturedRecipeResponse = {
      id: typedNewFeaturedRecipe.id,
      recipeId: typedNewFeaturedRecipe.recipeId,
    };

    await recipeState.put(CACHE_KEY, JSON.stringify(response), { expirationTtl: CACHE_TTL });

    const duration = Date.now() - startTime;
    console.log(`Featured recipe generation completed in ${duration}ms`, {
      recipeId: selectedRecipeId,
      featuredRecipeId: typedNewFeaturedRecipe.id,
    });
  } catch (error) {
    console.error("Featured recipe generation failed", error);
  } finally {
    await recipeState.delete(`${FEATURED_RECIPE_STATE_PREFIX}generating`);
  }
}
