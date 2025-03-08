import type { z } from "zod";
import { publicProcedure } from "../../trpc";
import type { EstimatedCosts } from "../../db/schema/recipes";
import type { RecipeResponseSchema } from "../../../schemas/recipe-response";
import { tryCatch } from "@dishify/app/utils/helpers";
import type { Context } from "../../context";

const CACHE_KEY = "trending-recipes";
const RATE_LIMIT_KEY = "trending-refresh-in-progress";

// Define the trending recipe type using schema-defined types
export type TrendingRecipe = {
  id: string;
  slug: string;
  data: NonNullable<z.infer<typeof RecipeResponseSchema>>;
  trendingScore: number;
  estimatedCost: EstimatedCosts[keyof EstimatedCosts] | null;
};

/**
 * Checks if a trending refresh is needed and queues a refresh job if necessary
 */
const checkAndQueueRefresh = async (ctx: Context, cached: string | null) => {
  // Check if a refresh is already in progress
  const { data: inProgress, error: lockError } = await tryCatch(
    ctx.recipeState.get(RATE_LIMIT_KEY),
  );

  if (lockError) {
    console.error("Failed to check trending refresh lock:", {
      error: lockError.message,
    });
  } else if (inProgress) {
    console.log("Trending refresh already in progress, skipping queue");
    return;
  }

  // Queue a job to refresh the trending recipes
  const { error: queueError } = await tryCatch(
    ctx.recipeQueue.send({
      recipeId: "trending", // Using a placeholder ID since we don't have a specific recipe ID
      type: "trending-refresh",
      timestamp: Date.now(),
    }),
  );

  if (queueError) {
    console.error("Failed to queue trending refresh:", {
      error: queueError.message,
    });
  } else {
    console.log("Successfully queued trending refresh");
  }
};

/**
 * Generates trending recipes on-demand when no cache exists
 * This is only used when there's no cache at all, to avoid showing an empty list
 */
const generateTrendingRecipesOnDemand = async (ctx: Context): Promise<TrendingRecipe[]> => {
  console.log("No cache exists, generating trending recipes on-demand");

  // Queue a refresh in the background
  await checkAndQueueRefresh(ctx, null);

  // Return an empty array - the background job will populate the cache
  // This is better than making users wait for the full computation
  return [];
};

export const trending = publicProcedure.query(async ({ ctx }): Promise<TrendingRecipe[]> => {
  // Try to get from KV cache first
  const { data: cached, error: cacheError } = await tryCatch(ctx.recipeState.get(CACHE_KEY));

  if (cacheError) {
    console.error("Failed to fetch trending recipes from cache:", {
      error: cacheError.message,
    });
    // Queue a refresh in the background
    await checkAndQueueRefresh(ctx, null);
  } else if (!cached) {
    // No cache exists yet, generate trending recipes on-demand
    // This should only happen on the first request after deployment
    return await generateTrendingRecipesOnDemand(ctx);
  } else {
    try {
      // We have valid cached data, queue a refresh in the background if needed
      await checkAndQueueRefresh(ctx, cached);

      // Return the cached data
      return JSON.parse(cached) as TrendingRecipe[];
    } catch (parseError) {
      console.error("Failed to parse cached trending recipes:", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });

      // Queue a refresh in the background
      await checkAndQueueRefresh(ctx, null);

      // Return an empty array - the background job will populate the cache
      return [];
    }
  }

  // If we reach here, it means we had a cache error but we should still try to return something
  return [];
});
