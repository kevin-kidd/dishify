import { desc, eq } from "drizzle-orm";
import { publicProcedure } from "../../trpc";
import { FeaturedRecipeTable, EnglishRecipesTable } from "../../db/schema/recipes";
import { tryCatch } from "@dishify/app/utils/helpers";
import { TRPCError } from "@trpc/server";
import type { RecipeQueueMessage } from "../../types";

const CACHE_EXPIRATION_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Get the featured recipe
export const getFeaturedRecipe = publicProcedure.query(async ({ ctx }) => {
  const { db, recipeQueue } = ctx;

  try {
    // Fetch the latest featured recipe from the database
    const { data: latestFeaturedRecipe, error: dbError } = await tryCatch(
      db
        .select()
        .from(FeaturedRecipeTable)
        .orderBy(desc(FeaturedRecipeTable.updatedAt))
        .limit(1)
        .get(),
    );

    if (dbError || !latestFeaturedRecipe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get featured recipe",
        cause: dbError,
      });
    }

    const cacheTime = new Date(latestFeaturedRecipe.updatedAt).getTime();
    const now = Date.now();

    // Check if the cache has expired
    if (now - cacheTime > CACHE_EXPIRATION_MS) {
      // Check if the featured recipe is already in generating state
      if (!latestFeaturedRecipe.generating) {
        // Send a message to the queue to refresh the featured recipe
        const queueMessage: RecipeQueueMessage = {
          recipeId: "featured",
          hasImage: false,
          type: "featured",
        };

        const { error: queueError } = await tryCatch(recipeQueue.send(queueMessage));

        if (queueError) {
          console.error("Failed to queue featured recipe generation:", {
            error: queueError.message,
          });
        } else {
          console.log("Queued featured recipe generation");
        }
      }
    }

    // Fetch the full recipe details
    const { data: recipeDetails, error: detailsError } = await tryCatch(
      db
        .select()
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.id, latestFeaturedRecipe.recipeId))
        .get(),
    );

    if (detailsError || !recipeDetails) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get recipe details",
        cause: detailsError,
      });
    }

    if (!recipeDetails.data) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Recipe data is missing",
      });
    }

    // Return the complete featured recipe data
    return {
      id: latestFeaturedRecipe.id,
      recipeId: latestFeaturedRecipe.recipeId,
      slug: recipeDetails.slug,
      dishName: recipeDetails.data.dishName,
      description: recipeDetails.description || "",
      imageUrl: recipeDetails.imageUrl || "",
      cuisine: recipeDetails.data.cuisine,
      difficulty: recipeDetails.data.difficulty,
      cookingTime: recipeDetails.data.cookingTime,
      servings: recipeDetails.data.servings,
      keyIngredients: recipeDetails.data.shoppingList.slice(0, 5).map((item) => item.item),
      createdAt: latestFeaturedRecipe.createdAt,
      estimatedCosts: recipeDetails.estimatedCosts,
      category: recipeDetails.category || undefined,
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    console.error("Error in getFeaturedRecipe", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get featured recipe",
      cause: error,
    });
  }
});
