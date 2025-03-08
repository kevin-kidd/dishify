import { and, eq, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { z } from "zod";
import {
  EnglishRecipesTable,
  RecipeReactionsTable,
  TrendingRecipesTable,
  TrendingStatusTable,
  type EstimatedCosts,
} from "../db/schema/recipes";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import type { RecipeResponseSchema } from "../../schemas/recipe-response";
import type { RegionSchema } from "../../schemas/marketplace";
import type { Bindings, RecipeQueueMessage } from "../types";
import { tryCatch } from "@dishify/app/utils/helpers";
import type { TrendingRecipe } from "../routes/recipe/trending";

// Constants
const TRENDING_LIMIT = 10;
const HOURS_24 = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TIME_WINDOWS = 3;

type RecipeWithReactions = TrendingRecipe & {
  reactions: { emoji: string; timestamp: string }[];
};

type RecipeReactionRow = {
  id: string;
  name: string;
  slug: string;
  data: unknown;
  estimatedCosts: EstimatedCosts | null;
  emoji: string | null;
  reactionTime: string | null;
};

/**
 * Calculates trending score based on reactions and their timestamps
 */
const calculateTrendingScore = (reactions: { emoji: string; timestamp: string }[]) => {
  const now = Date.now();
  return reactions.reduce((score, { emoji, timestamp }) => {
    const reactionTime = new Date(timestamp).getTime();
    const hoursSinceReaction = (now - reactionTime) / (60 * 60 * 1000);

    // Time decay factor (1.0 to 0.1) over 7 days
    const timeDecay = Math.max(0.1, 1 - hoursSinceReaction / (24 * 7));

    // Extra weight for recent reactions (last 24h)
    const recencyBonus = now - reactionTime <= HOURS_24 ? 2 : 1;

    // Base points (-1 for negative reactions, +1 for positive)
    const basePoints = ["👎", "🤢", "🤮"].includes(emoji) ? -1 : 1;

    return score + basePoints * timeDecay * recencyBonus;
  }, 0);
};

/**
 * Fetches recipes with reactions from a specific time window
 */
const fetchRecipesWithReactions = async (
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  lookbackPeriods = 1,
) => {
  const periodInMs = lookbackPeriods * WEEK_IN_MS;
  const lookbackDate = new Date(Date.now() - periodInMs).toISOString();

  console.log(`Fetching trending recipes with reactions from the last ${lookbackPeriods * 7} days`);

  return await tryCatch(
    db
      .select({
        id: EnglishRecipesTable.id,
        name: EnglishRecipesTable.name,
        slug: EnglishRecipesTable.slug,
        data: EnglishRecipesTable.data,
        estimatedCosts: EnglishRecipesTable.estimatedCosts,
        emoji: RecipeReactionsTable.emoji,
        reactionTime: RecipeReactionsTable.createdAt,
      })
      .from(EnglishRecipesTable)
      .leftJoin(
        RecipeReactionsTable,
        and(
          eq(EnglishRecipesTable.id, RecipeReactionsTable.recipeId),
          gte(RecipeReactionsTable.createdAt, lookbackDate),
        ),
      )
      .where(eq(EnglishRecipesTable.status, "completed")),
  );
};

/**
 * Processes the raw DB results into a map of recipes with their reactions
 */
const processRecipesWithReactions = (recipesWithReactions: RecipeReactionRow[], region: string) => {
  return (recipesWithReactions || []).reduce<Record<string, RecipeWithReactions>>((acc, row) => {
    if (!acc[row.id]) {
      if (!row.data) return acc;

      acc[row.id] = {
        id: row.id,
        slug: row.slug,
        data: row.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
        estimatedCost: row.estimatedCosts?.[region as keyof typeof row.estimatedCosts] ?? null,
        trendingScore: 0,
        reactions: [],
      };
    }
    if (row.emoji && row.reactionTime) {
      acc[row.id].reactions.push({
        emoji: row.emoji,
        timestamp: row.reactionTime,
      });
    }
    return acc;
  }, {});
};

/**
 * Fetches random recipes to fill up the trending list
 */
const fetchRandomRecipes = async (
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  region: string,
  neededCount: number,
  existingIds: Set<string>,
) => {
  console.log(`Fetching ${neededCount} random recipes to fill trending list`);

  const { data: additionalRecipes, error: randomFetchError } = await tryCatch(
    db
      .select({
        id: EnglishRecipesTable.id,
        name: EnglishRecipesTable.name,
        slug: EnglishRecipesTable.slug,
        data: EnglishRecipesTable.data,
        estimatedCosts: EnglishRecipesTable.estimatedCosts,
      })
      .from(EnglishRecipesTable)
      .where(eq(EnglishRecipesTable.status, "completed"))
      .limit(neededCount * 2),
  );

  if (randomFetchError) {
    console.error("Failed to fetch additional random recipes:", {
      error: randomFetchError.message,
    });
    return [];
  }

  if (!additionalRecipes || !Array.isArray(additionalRecipes) || additionalRecipes.length === 0) {
    console.log("No additional recipes found in the database");
    return [];
  }

  console.log(`Found ${additionalRecipes.length} random recipes, filtering and mapping`);

  // Filter out recipes that are already in the trending list and have valid data
  const filteredRecipes = additionalRecipes
    .filter((row) => !existingIds.has(row.id) && row.data)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      data: row.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
      trendingScore: 0,
      estimatedCost: row.estimatedCosts?.[region as keyof typeof row.estimatedCosts] ?? null,
    }))
    .slice(0, neededCount);

  console.log(`Returning ${filteredRecipes.length} random recipes`);
  return filteredRecipes;
};

/**
 * Ensures the trending status is reset to not in progress
 * This is a safety function to make sure we don't get stuck
 */
const resetTrendingStatus = async (
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  error?: Error,
) => {
  console.log("Resetting trending status to not in progress");

  try {
    await db
      .update(TrendingStatusTable)
      .set({
        refreshInProgress: false,
        lastRefreshCompleted: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(error && { lastError: error.message }),
      })
      .where(eq(TrendingStatusTable.id, "singleton"));

    console.log("Successfully reset trending status");
  } catch (resetError) {
    console.error("Failed to reset trending status:", {
      error: resetError instanceof Error ? resetError.message : String(resetError),
      originalError: error?.message,
    });
  }
};

/**
 * Handles the trending refresh queue message
 */
export async function refreshTrendingRecipes(
  message: RecipeQueueMessage,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  env: Bindings,
) {
  if (message.type !== "trending-refresh") {
    return;
  }

  console.log("[Queue Handler] Trending refresh triggered");

  // Check if a refresh is already in progress
  const { data: statusRow, error: statusError } = await tryCatch(
    db.select().from(TrendingStatusTable).where(eq(TrendingStatusTable.id, "singleton")).get(),
  );

  if (statusError) {
    console.error("Failed to check trending refresh status:", statusError);
    return;
  }

  const currentTime = Date.now();
  if (statusRow?.refreshInProgress && statusRow.lastRefreshStarted) {
    const elapsedTime = currentTime - new Date(statusRow.lastRefreshStarted).getTime();

    if (elapsedTime < 60000) {
      // 60 seconds
      console.log(
        `[Queue Handler] Refresh already in progress for ${elapsedTime / 1000} seconds, skipping.`,
      );
      return;
    }

    console.warn(`[Queue Handler] Refresh stuck for ${elapsedTime / 1000} seconds, proceeding.`);
  }

  // Explicitly set refreshInProgress to true at the start
  const { error: updateError } = await tryCatch(
    db
      .update(TrendingStatusTable)
      .set({
        refreshInProgress: true,
        lastRefreshStarted: new Date(currentTime).toISOString(),
        updatedAt: new Date(currentTime).toISOString(),
        lastError: null,
      })
      .where(eq(TrendingStatusTable.id, "singleton")),
  );

  if (updateError) {
    console.error("Failed to set refreshInProgress status:", updateError);
    return;
  }

  let processingError: Error | undefined;

  try {
    const region = "US" as z.infer<typeof RegionSchema>;
    let trendingRecipes: TrendingRecipe[] = [];

    // First try to get recipes with reactions
    console.log("[Queue Handler] Fetching recipes with reactions");
    let lookbackPeriods = 1;
    let recipeReactions: Record<string, RecipeWithReactions> = {};

    while (lookbackPeriods <= MAX_TIME_WINDOWS) {
      const { data: recipesWithReactions, error: fetchError } = await fetchRecipesWithReactions(
        db,
        lookbackPeriods,
      );

      if (fetchError) {
        console.error(`Failed to fetch trending recipes for lookback period ${lookbackPeriods}:`, {
          error: fetchError.message,
        });
        // Don't break here, continue to try random recipes
        break;
      }

      if (
        recipesWithReactions &&
        Array.isArray(recipesWithReactions) &&
        recipesWithReactions.length > 0
      ) {
        console.log(`Found ${recipesWithReactions.length} recipes with potential reactions`);

        recipeReactions = processRecipesWithReactions(
          recipesWithReactions as RecipeReactionRow[],
          region,
        );

        const recipesWithScores = Object.values(recipeReactions)
          .map((recipe) => ({
            id: recipe.id,
            slug: recipe.slug,
            data: recipe.data,
            trendingScore: calculateTrendingScore(recipe.reactions),
            estimatedCost: recipe.estimatedCost,
          }))
          .filter((recipe) => recipe.trendingScore > 0) // Only include recipes with positive scores
          .sort((a, b) => b.trendingScore - a.trendingScore);

        console.log(`Found ${recipesWithScores.length} recipes with positive trending scores`);
        trendingRecipes = recipesWithScores;

        if (trendingRecipes.length >= TRENDING_LIMIT) {
          break;
        }
      } else {
        console.log(`No recipes with reactions found for lookback period ${lookbackPeriods}`);
      }

      lookbackPeriods++;
    }

    console.log(
      `Found ${trendingRecipes.length} trending recipes with reactions after ${lookbackPeriods} lookback periods`,
    );

    // If we don't have enough trending recipes with reactions, fill with random recipes
    if (trendingRecipes.length < TRENDING_LIMIT) {
      const existingIds = new Set(trendingRecipes.map((recipe) => recipe.id));
      const neededCount = TRENDING_LIMIT - trendingRecipes.length;

      console.log(`Need ${neededCount} more recipes to reach the limit of ${TRENDING_LIMIT}`);
      const randomRecipes = await fetchRandomRecipes(db, region, neededCount, existingIds);

      if (randomRecipes.length > 0) {
        console.log(`Adding ${randomRecipes.length} random recipes to trending list`);
        trendingRecipes = [...trendingRecipes, ...randomRecipes];
      } else {
        console.log("No random recipes found to add to trending list");
      }
    }

    // If we still don't have any trending recipes, try one more time with a larger limit
    if (trendingRecipes.length === 0) {
      console.log("No trending recipes found, trying one more time with a larger limit");

      const { data: allRecipes, error: allRecipesError } = await tryCatch(
        db
          .select({
            id: EnglishRecipesTable.id,
            name: EnglishRecipesTable.name,
            slug: EnglishRecipesTable.slug,
            data: EnglishRecipesTable.data,
            estimatedCosts: EnglishRecipesTable.estimatedCosts,
          })
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.status, "completed"))
          .limit(TRENDING_LIMIT * 3),
      );

      if (allRecipesError) {
        console.error("Failed to fetch all recipes:", {
          error: allRecipesError.message,
        });
      } else if (allRecipes && Array.isArray(allRecipes) && allRecipes.length > 0) {
        console.log(`Found ${allRecipes.length} total recipes, using as trending`);

        trendingRecipes = allRecipes
          .filter((row) => row.data)
          .map((row) => ({
            id: row.id,
            slug: row.slug,
            data: row.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
            trendingScore: 0,
            estimatedCost: row.estimatedCosts?.[region as keyof typeof row.estimatedCosts] ?? null,
          }))
          .slice(0, TRENDING_LIMIT);
      }
    }

    trendingRecipes = trendingRecipes.slice(0, TRENDING_LIMIT);

    console.log(
      `[Queue Handler] Found ${trendingRecipes.length} recipes after reactions and random fetch`,
    );

    // Check if we have any trending recipes to store
    if (trendingRecipes.length === 0) {
      console.error("No trending recipes to store, something went wrong");
      processingError = new Error("No trending recipes to store");
      return;
    }

    // First, check if we have any existing trending recipes
    const { data: existingTrending, error: countError } = await tryCatch(
      db.select().from(TrendingRecipesTable).all(),
    );

    if (countError) {
      console.error("Failed to check existing trending recipes:", {
        error: countError.message,
      });
      processingError = countError;
    } else {
      console.log(
        `Found ${existingTrending?.length || 0} existing trending recipes in the database`,
      );
    }

    // Use a batch operation to ensure atomicity
    console.log("[Queue Handler] Starting batch operation to store trending recipes");
    try {
      await db.batch([
        db.delete(TrendingRecipesTable),
        ...trendingRecipes.map((recipe, i) =>
          db.insert(TrendingRecipesTable).values({
            recipeId: recipe.id,
            slug: recipe.slug,
            data: recipe.data,
            trendingScore: recipe.trendingScore,
            estimatedCost: recipe.estimatedCost,
            rank: i + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        ),
      ]);

      console.log("[Queue Handler] Batch operation completed successfully");
    } catch (batchError) {
      console.error("Batch operation failed:", batchError);
      processingError = batchError as Error;
    }
  } catch (error) {
    console.error("[Queue Handler] Error during trending recipes refresh:", error);
    processingError = error as Error;
  } finally {
    console.log("[Queue Handler] Resetting trending status");
    await resetTrendingStatus(db, processingError);
  }
}
