import { desc } from "drizzle-orm";
import { publicProcedure } from "../../trpc";
import { FeaturedRecipeTable, type FeaturedRecipe } from "../../db/schema/recipes";
import { tryCatch } from "@dishify/app/utils/helpers";
import { TRPCError } from "@trpc/server";
import type { RecipeQueueMessage } from "../../types";
import type { FeaturedRecipeResponse } from "../../queues/featured";

const CACHE_KEY = "featured-recipe";
const FEATURED_RECIPE_STATE_PREFIX = "featured_recipe_state:";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Get the featured recipe
export const getFeaturedRecipe = publicProcedure.query(async ({ ctx }) => {
  // Use the properly typed context
  const { db, recipeState } = ctx;

  try {
    // Try to get from KV cache first
    const { data: cachedRecipe, error: cacheError } = await tryCatch(
      recipeState.get(CACHE_KEY, { type: "json" }),
    );

    if (cachedRecipe && !cacheError) {
      // Check if the cached recipe is still valid (less than 24h old)
      const cacheTime = new Date((cachedRecipe as any).createdAt).getTime();
      const now = Date.now();

      if (now - cacheTime < ONE_DAY_MS) {
        return cachedRecipe as FeaturedRecipeResponse;
      }

      // If cache is expired, don't return it but continue to generate a new one
      console.log("Featured recipe cache expired, generating new one");
    }

    // Get the latest featured recipe from the database
    const { data: featuredRecipe, error: dbError } = await tryCatch(
      db
        .select()
        .from(FeaturedRecipeTable)
        .orderBy(desc(FeaturedRecipeTable.createdAt))
        .limit(1)
        .get(),
    );

    if (dbError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get featured recipe",
        cause: dbError,
      });
    }

    if (featuredRecipe) {
      const typedFeaturedRecipe = featuredRecipe as FeaturedRecipe;
      const cacheTime = new Date(typedFeaturedRecipe.createdAt).getTime();
      const now = Date.now();

      // If the featured recipe is less than 24h old, return it and update the cache
      if (now - cacheTime < ONE_DAY_MS) {
        const response: FeaturedRecipeResponse = {
          id: typedFeaturedRecipe.id,
          recipeId: typedFeaturedRecipe.recipeId,
          slug: typedFeaturedRecipe.slug,
          dishName: typedFeaturedRecipe.dishName,
          description: typedFeaturedRecipe.description,
          imageUrl: typedFeaturedRecipe.imageUrl,
          cuisine: typedFeaturedRecipe.cuisine,
          difficulty: typedFeaturedRecipe.difficulty,
          cookingTime: typedFeaturedRecipe.cookingTime,
          servings: typedFeaturedRecipe.servings,
          keyIngredients: typedFeaturedRecipe.keyIngredients || [],
          createdAt: typedFeaturedRecipe.createdAt,
        };

        // Update the KV cache
        await tryCatch(
          recipeState.put(CACHE_KEY, JSON.stringify(response), { expirationTtl: 86400 }),
        );

        return response;
      }

      // If the featured recipe is more than 24h old, generate a new one
      console.log("Featured recipe is more than 24h old, generating new one");
    }

    // Check if there's already a generation in progress
    const { data: generationInProgress, error: generationError } = await tryCatch(
      recipeState.get(`${FEATURED_RECIPE_STATE_PREFIX}generating`),
    );

    if (generationInProgress && !generationError) {
      // If generation is in progress, return the latest featured recipe or null
      if (featuredRecipe) {
        const typedFeaturedRecipe = featuredRecipe as FeaturedRecipe;
        const response: FeaturedRecipeResponse = {
          id: typedFeaturedRecipe.id,
          recipeId: typedFeaturedRecipe.recipeId,
          slug: typedFeaturedRecipe.slug,
          dishName: typedFeaturedRecipe.dishName,
          description: typedFeaturedRecipe.description,
          imageUrl: typedFeaturedRecipe.imageUrl,
          cuisine: typedFeaturedRecipe.cuisine,
          difficulty: typedFeaturedRecipe.difficulty,
          cookingTime: typedFeaturedRecipe.cookingTime,
          servings: typedFeaturedRecipe.servings,
          keyIngredients: typedFeaturedRecipe.keyIngredients || [],
          createdAt: typedFeaturedRecipe.createdAt,
        };
        return response;
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Featured recipe is being generated",
      });
    }

    // Start background generation via the queue
    const queueMessage: RecipeQueueMessage = {
      recipeId: "featured", // Not used but required by the interface
      hasImage: false,
      type: "featured",
    };

    const { error: queueError } = await tryCatch(ctx.recipeQueue.send(queueMessage));

    if (queueError) {
      console.error("Failed to queue featured recipe generation:", {
        error: queueError.message,
      });
    } else {
      console.log("Queued featured recipe generation");
    }

    // Return the latest featured recipe or throw error
    if (featuredRecipe) {
      const typedFeaturedRecipe = featuredRecipe as FeaturedRecipe;
      const response: FeaturedRecipeResponse = {
        id: typedFeaturedRecipe.id,
        recipeId: typedFeaturedRecipe.recipeId,
        slug: typedFeaturedRecipe.slug,
        dishName: typedFeaturedRecipe.dishName,
        description: typedFeaturedRecipe.description,
        imageUrl: typedFeaturedRecipe.imageUrl,
        cuisine: typedFeaturedRecipe.cuisine,
        difficulty: typedFeaturedRecipe.difficulty,
        cookingTime: typedFeaturedRecipe.cookingTime,
        servings: typedFeaturedRecipe.servings,
        keyIngredients: typedFeaturedRecipe.keyIngredients || [],
        createdAt: typedFeaturedRecipe.createdAt,
      };
      return response;
    }

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Featured recipe is being generated",
    });
  } catch (error) {
    console.error("Error in getFeaturedRecipe", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get featured recipe",
      cause: error,
    });
  }
});
