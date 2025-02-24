import { and, eq, gte } from "drizzle-orm";
import type { z } from "zod";
import { publicProcedure } from "../../trpc";
import {
  EnglishRecipesTable,
  type EstimatedCosts,
  RecipeReactionsTable,
} from "../../db/schema/recipes";
import { RecipeResponseSchema } from "../../../schemas/recipe-response";
import type { Region } from "../marketplace/types";
import type { RegionSchema } from "../../../schemas/marketplace";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "@dishify/app/utils/helpers";

const CACHE_KEY = "trending-recipes";
const CACHE_TTL = 300; // 5 minutes in seconds
const TRENDING_LIMIT = 10;
const HOURS_24 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Define the trending recipe type
export type TrendingRecipe = {
  id: string;
  slug: string;
  data: NonNullable<z.infer<typeof RecipeResponseSchema>>;
  trendingScore: number;
  estimatedCost: EstimatedCosts[keyof EstimatedCosts] | null;
};

/**
 * Calculates trending score based on reactions and their timestamps
 * Score formula:
 * - Base points for each reaction (positive/negative)
 * - Time decay factor based on reaction age
 * - Extra weight for reactions in last 24 hours
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

export const trending = publicProcedure.query(async ({ ctx }): Promise<TrendingRecipe[]> => {
  // Try to get from KV cache first
  const { data: cached, error: cacheError } = await tryCatch(ctx.recipeState.get(CACHE_KEY));

  if (cacheError) {
    console.error("Failed to fetch trending recipes from cache:", {
      error: cacheError.message,
    });
    // Continue execution, we'll fetch fresh data
  } else if (cached) {
    try {
      return JSON.parse(cached) as TrendingRecipe[];
    } catch (parseError) {
      console.error("Failed to parse cached trending recipes:", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      // Continue execution, we'll fetch fresh data
    }
  }

  const detectedRegion = ctx.cf?.country;
  const region = (detectedRegion ?? "US") as z.infer<typeof RegionSchema>;

  // Get recipes with their reactions from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recipesWithReactions, error: fetchError } = await tryCatch(
    ctx.db
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
          gte(RecipeReactionsTable.createdAt, sevenDaysAgo),
        ),
      )
      .where(eq(EnglishRecipesTable.status, "completed")),
  );

  if (fetchError) {
    console.error("Failed to fetch trending recipes:", {
      error: fetchError.message,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch trending recipes",
    });
  }

  // Group reactions by recipe
  const recipeReactions = (recipesWithReactions || []).reduce<
    Record<string, TrendingRecipe & { reactions: { emoji: string; timestamp: string }[] }>
  >((acc, row) => {
    if (!acc[row.id]) {
      // Ensure data is not null before creating the recipe entry
      if (!row.data) return acc;

      const parsed = RecipeResponseSchema.safeParse(row.data);
      if (!parsed.success) {
        console.error(`Invalid recipe data for ${row.id}:`, parsed.error);
        return acc;
      }

      acc[row.id] = {
        id: row.id,
        slug: row.slug,
        data: parsed.data,
        estimatedCost: row.estimatedCosts?.[region] ?? null,
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

  // Calculate trending scores and sort
  const trendingRecipes: TrendingRecipe[] = Object.values(recipeReactions)
    .map((recipe) => ({
      id: recipe.id,
      slug: recipe.slug,
      data: recipe.data,
      trendingScore: calculateTrendingScore(recipe.reactions),
      estimatedCost: recipe.estimatedCost,
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, TRENDING_LIMIT);

  // Cache the results in KV with expiration
  const { error: cacheWriteError } = await tryCatch(
    ctx.recipeState.put(CACHE_KEY, JSON.stringify(trendingRecipes), {
      expirationTtl: CACHE_TTL,
    }),
  );

  if (cacheWriteError) {
    console.error("Failed to cache trending recipes:", {
      error: cacheWriteError.message,
    });
    // Continue execution, caching failure is not critical
  }

  return trendingRecipes;
});
