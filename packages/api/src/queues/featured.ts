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
import { generateRecipeDescription, generateRecipeImage } from "./generate";

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
  let selectedRecipeId: string | null = null;

  try {
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

    const { data: selectedRecipe, error: recipeFetchError } = await tryCatch(
      db
        .select()
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.id, selectedRecipeId))
        .get(),
    );

    if (recipeFetchError || !selectedRecipe) {
      throw new Error("Failed to fetch selected recipe details");
    }

    if (!selectedRecipe.data) {
      throw new Error("Selected recipe data is missing");
    }

    const updateData: Partial<typeof selectedRecipe> = {};

    if (!selectedRecipe.description || selectedRecipe.description.trim() === "") {
      updateData.description = await generateRecipeDescription(
        selectedRecipe.data.dishName,
        selectedRecipe.data.cuisine,
        selectedRecipe.data.shoppingList,
        env,
      );
    }

    if (!selectedRecipe.imageUrl || selectedRecipe.imageUrl.trim() === "") {
      updateData.imageUrl = await generateRecipeImage(
        selectedRecipe.data.dishName,
        selectedRecipe.data.cuisine,
        env,
      );
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date().toISOString();
      await tryCatch(
        db
          .update(EnglishRecipesTable)
          .set(updateData)
          .where(eq(EnglishRecipesTable.id, selectedRecipeId)),
      );
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

    // Check if the singleton row exists
    const { data: currentFeaturedRecipe, error: currentError } = await tryCatch(
      db.select().from(FeaturedRecipeTable).where(eq(FeaturedRecipeTable.id, "singleton")).get(),
    );

    if (currentError) {
      throw new Error("Failed to fetch current featured recipe state");
    }

    // If the singleton row doesn't exist, create it
    if (!currentFeaturedRecipe) {
      await tryCatch(
        db.insert(FeaturedRecipeTable).values({
          id: "singleton",
          recipeId: "", // Placeholder, to be updated
          generating: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
    }

    // Update the singleton row with the selected recipe
    await tryCatch(
      db
        .update(FeaturedRecipeTable)
        .set({
          recipeId: selectedRecipeId,
          generating: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(FeaturedRecipeTable.id, "singleton")),
    );

    const duration = Date.now() - startTime;
    console.log(`Featured recipe generation completed in ${duration}ms`, {
      recipeId: selectedRecipeId,
      featuredRecipeId: typedNewFeaturedRecipe.id,
    });
  } catch (error) {
    console.error("Featured recipe generation failed", error);
  } finally {
    if (selectedRecipeId) {
      await tryCatch(
        db
          .update(FeaturedRecipeTable)
          .set({ generating: false, updatedAt: new Date().toISOString() })
          .where(eq(FeaturedRecipeTable.id, "singleton")),
      );
    }
  }
}
