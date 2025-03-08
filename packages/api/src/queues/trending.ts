import { and, eq, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { z } from "zod";
import {
  EnglishRecipesTable,
  RecipeReactionsTable,
  type EstimatedCosts,
} from "../db/schema/recipes";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import { RecipeResponseSchema } from "../../schemas/recipe-response";
import type { RegionSchema } from "../../schemas/marketplace";
import type { Bindings, RecipeQueueMessage } from "../types";
import { tryCatch } from "@dishify/app/utils/helpers";
import type { TrendingRecipe } from "../routes/recipe/trending";

// Constants
const CACHE_KEY = "trending-recipes";
const CACHE_TTL = 300; // 5 minutes in seconds
const TRENDING_LIMIT = 10;
const HOURS_24 = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TIME_WINDOWS = 3;
const RATE_LIMIT_KEY = "trending-refresh-in-progress";

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
 * Creates a backward compatible schema for validation
 */
const createBackwardCompatibleSchema = () => {
  return RecipeResponseSchema.merge(RecipeResponseSchema.partial());
};

const BackwardCompatibleRecipeSchema = createBackwardCompatibleSchema();

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

      const parsed = BackwardCompatibleRecipeSchema.safeParse(row.data);
      if (!parsed.success) {
        console.error(`Invalid recipe data for ${row.id}:`, parsed.error);
        console.error(
          `Validation errors for recipe ${row.id}:`,
          JSON.stringify(parsed.error.format()),
        );
        return acc;
      }

      acc[row.id] = {
        id: row.id,
        slug: row.slug,
        data: parsed.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
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
    return [];
  }

  return additionalRecipes
    .filter((row) => !existingIds.has(row.id) && row.data)
    .map((row) => {
      const parsed = BackwardCompatibleRecipeSchema.safeParse(row.data);
      if (!parsed.success) return null;

      return {
        id: row.id,
        slug: row.slug,
        data: parsed.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
        trendingScore: 0,
        estimatedCost: row.estimatedCosts?.[region as keyof typeof row.estimatedCosts] ?? null,
      };
    })
    .filter((recipe): recipe is TrendingRecipe => recipe !== null)
    .slice(0, neededCount);
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

  console.log("Starting trending recipes refresh");

  const { data: inProgress, error: lockError } = await tryCatch(
    env.RECIPE_STATE.get(RATE_LIMIT_KEY),
  );

  if (lockError) {
    console.error("Failed to check trending refresh lock:", {
      error: lockError.message,
    });
  } else if (inProgress) {
    console.log("Trending refresh already in progress, skipping");
    return;
  }

  const { error: setLockError } = await tryCatch(
    env.RECIPE_STATE.put(RATE_LIMIT_KEY, "true", { expirationTtl: 300 }),
  );

  if (setLockError) {
    console.error("Failed to set trending refresh lock:", {
      error: setLockError.message,
    });
  }

  try {
    const region = "US" as z.infer<typeof RegionSchema>;
    let lookbackPeriods = 1;
    let recipeReactions: Record<string, RecipeWithReactions> = {};
    let trendingRecipes: TrendingRecipe[] = [];

    while (lookbackPeriods <= MAX_TIME_WINDOWS) {
      const { data: recipesWithReactions, error: fetchError } = await fetchRecipesWithReactions(
        db,
        lookbackPeriods,
      );

      if (fetchError) {
        console.error(`Failed to fetch trending recipes for lookback period ${lookbackPeriods}:`, {
          error: fetchError.message,
        });
        break;
      }

      recipeReactions = processRecipesWithReactions(
        Array.isArray(recipesWithReactions) ? (recipesWithReactions as RecipeReactionRow[]) : [],
        region,
      );

      trendingRecipes = Object.values(recipeReactions)
        .map((recipe) => ({
          id: recipe.id,
          slug: recipe.slug,
          data: recipe.data,
          trendingScore: calculateTrendingScore(recipe.reactions),
          estimatedCost: recipe.estimatedCost,
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore);

      if (trendingRecipes.length >= TRENDING_LIMIT) {
        break;
      }

      lookbackPeriods++;
    }

    console.log(
      `Found ${trendingRecipes.length} trending recipes with reactions after ${lookbackPeriods} lookback periods`,
    );

    if (trendingRecipes.length < TRENDING_LIMIT) {
      const existingIds = new Set(trendingRecipes.map((recipe) => recipe.id));
      const neededCount = TRENDING_LIMIT - trendingRecipes.length;

      const randomRecipes = await fetchRandomRecipes(db, region, neededCount, existingIds);
      trendingRecipes = [...trendingRecipes, ...randomRecipes];
    }

    trendingRecipes = trendingRecipes.slice(0, TRENDING_LIMIT);

    const { error: cacheWriteError } = await tryCatch(
      env.RECIPE_STATE.put(CACHE_KEY, JSON.stringify(trendingRecipes), {
        expirationTtl: CACHE_TTL,
      }),
    );

    if (cacheWriteError) {
      console.error("Failed to cache trending recipes:", {
        error: cacheWriteError.message,
      });
    } else {
      console.log(`Successfully cached ${trendingRecipes.length} trending recipes`);
    }
  } catch (error) {
    console.error("Error during trending recipes refresh:", {
      error: (error as Error).message,
    });
  } finally {
    const { error: clearLockError } = await tryCatch(env.RECIPE_STATE.delete(RATE_LIMIT_KEY));

    if (clearLockError) {
      console.error("Failed to clear trending refresh lock:", {
        error: clearLockError.message,
      });
    }
  }
}
