import { desc, eq } from "drizzle-orm";
import { publicProcedure } from "../../trpc";
import {
  FeaturedRecipeTable,
  EnglishRecipesTable,
  RecipeReactionsTable,
} from "../../db/schema/recipes";
import { tryCatch } from "@dishify/app/utils/helpers";
import { TRPCError } from "@trpc/server";
import type { RecipeQueueMessage } from "../../types";
import type { FeaturedRecipeResponse } from "../../queues/featured";
import type { RecipeResponse } from "../../../schemas/recipe-response";

const CACHE_KEY = "featured-recipe";
const FEATURED_RECIPE_STATE_PREFIX = "featured_recipe_state:";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Get the featured recipe
export const getFeaturedRecipe = publicProcedure.query(async ({ ctx }) => {
  // Use the properly typed context
  const { db, recipeState } = ctx;

  try {
    // Try to get from KV cache first to get the featured recipe ID
    const { data: cachedRecipeRef, error: cacheError } = await tryCatch(
      recipeState.get(CACHE_KEY, { type: "json" }),
    );

    let featuredRecipeId: string | null = null;

    if (cachedRecipeRef && !cacheError) {
      // Check if the cached reference is still valid (less than 24h old)
      const { data: featuredRecipe, error: dbError } = await tryCatch(
        db
          .select()
          .from(FeaturedRecipeTable)
          .where(eq(FeaturedRecipeTable.id, (cachedRecipeRef as FeaturedRecipeResponse).id))
          .get(),
      );

      if (!dbError && featuredRecipe) {
        const cacheTime = new Date(featuredRecipe.createdAt).getTime();
        const now = Date.now();

        if (now - cacheTime < ONE_DAY_MS) {
          // Cache is valid, use this featured recipe ID
          featuredRecipeId = featuredRecipe.id;
        } else {
          // Cache is expired, don't use it
          console.log("Featured recipe cache expired, generating new one");
        }
      }
    }

    // If no valid cached ID, get the latest featured recipe from the database
    if (!featuredRecipeId) {
      const { data: latestFeaturedRecipe, error: dbError } = await tryCatch(
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

      if (latestFeaturedRecipe) {
        const cacheTime = new Date(latestFeaturedRecipe.createdAt).getTime();
        const now = Date.now();

        // If the featured recipe is less than 24h old, use it
        if (now - cacheTime < ONE_DAY_MS) {
          featuredRecipeId = latestFeaturedRecipe.id;

          // Update the KV cache with the reference
          await tryCatch(
            recipeState.put(
              CACHE_KEY,
              JSON.stringify({
                id: latestFeaturedRecipe.id,
                recipeId: latestFeaturedRecipe.recipeId,
              }),
              { expirationTtl: 86400 },
            ),
          );
        } else {
          // If the featured recipe is more than 24h old, generate a new one
          console.log("Featured recipe is more than 24h old, generating new one");
        }
      }
    }

    // If we have a valid featured recipe ID, fetch all the data
    if (featuredRecipeId) {
      // Get the featured recipe reference
      const { data: featuredRecipe, error: featuredError } = await tryCatch(
        db
          .select()
          .from(FeaturedRecipeTable)
          .where(eq(FeaturedRecipeTable.id, featuredRecipeId))
          .get(),
      );

      if (featuredError || !featuredRecipe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get featured recipe reference",
          cause: featuredError,
        });
      }

      // Get the full recipe data
      const { data: recipeDetails, error: detailsError } = await tryCatch(
        db
          .select()
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.id, featuredRecipe.recipeId))
          .get(),
      );

      if (detailsError || !recipeDetails) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recipe details",
          cause: detailsError,
        });
      }

      // Get reactions for the recipe
      const { data: reactions, error: reactionsError } = await tryCatch(
        db
          .select()
          .from(RecipeReactionsTable)
          .where(eq(RecipeReactionsTable.recipeId, featuredRecipe.recipeId))
          .all(),
      );

      // Process reactions into a format that's easier to use
      const processedReactions: Record<string, { count: number; hasReacted: boolean }> = {};

      if (!reactionsError && reactions) {
        for (const reaction of reactions) {
          if (!processedReactions[reaction.emoji]) {
            processedReactions[reaction.emoji] = { count: 0, hasReacted: false };
          }
          processedReactions[reaction.emoji].count++;
        }
      }

      // Extract recipe data
      const recipeData = recipeDetails.data as RecipeResponse;

      if (!recipeData) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Recipe data is missing",
        });
      }

      // Return the complete featured recipe data
      return {
        id: featuredRecipe.id,
        recipeId: featuredRecipe.recipeId,
        slug: recipeDetails.slug,
        dishName: recipeData.dishName,
        description: recipeDetails.description || "",
        imageUrl: recipeDetails.imageUrl || "",
        cuisine: recipeData.cuisine,
        difficulty: recipeData.difficulty,
        cookingTime: recipeData.cookingTime,
        servings: recipeData.servings,
        keyIngredients: recipeData.shoppingList.slice(0, 5).map((item) => item.item),
        createdAt: featuredRecipe.createdAt,
        estimatedCosts: recipeDetails.estimatedCosts,
        category: recipeDetails.category || undefined,
        reactions: processedReactions,
      };
    }

    // If we don't have a valid featured recipe, check if generation is in progress
    const { data: generationInProgress, error: generationError } = await tryCatch(
      recipeState.get(`${FEATURED_RECIPE_STATE_PREFIX}generating`),
    );

    if (generationInProgress && !generationError) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Featured recipe is being generated",
      });
    }

    // Check if we've already queued a generation recently
    const { data: queuedRecently, error: queueCheckError } = await tryCatch(
      recipeState.get(`${FEATURED_RECIPE_STATE_PREFIX}queued`),
    );

    if (queuedRecently && !queueCheckError) {
      console.log("Featured recipe generation was recently queued, not queueing again");
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Featured recipe is being generated",
      });
    }

    // Set a flag to indicate we've queued a generation
    await tryCatch(
      recipeState.put(`${FEATURED_RECIPE_STATE_PREFIX}queued`, "true", {
        expirationTtl: 60, // 1 minute TTL to prevent duplicate queueing
      }),
    );

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

    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Featured recipe is being generated",
    });
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
