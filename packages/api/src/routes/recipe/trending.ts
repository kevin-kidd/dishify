import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { EnglishRecipesTable, RecipeReactionsTable } from "../../db/schema/recipes";
import { RecipeResponseSchema } from "../../../schemas/recipe-response";

const CACHE_KEY = "trending-recipes";
const CACHE_TTL = 300; // 5 minutes in seconds
const TRENDING_LIMIT = 10;
const HOURS_24 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

export const trending = publicProcedure.query(async ({ ctx }) => {
  // Try to get from KV cache first
  const cached = await ctx.recipeState.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Get recipes with their reactions from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const recipesWithReactions = await ctx.db
    .select({
      id: EnglishRecipesTable.id,
      name: EnglishRecipesTable.name,
      slug: EnglishRecipesTable.slug,
      data: EnglishRecipesTable.data,
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
    .where(eq(EnglishRecipesTable.status, "completed"));

  // Group reactions by recipe
  const recipeReactions = recipesWithReactions.reduce(
    (acc, row) => {
      if (!acc[row.id]) {
        acc[row.id] = {
          id: row.id,
          name: row.name,
          slug: row.slug,
          data: row.data,
          reactions: [],
        };
      }
      if (row.emoji) {
        acc[row.id].reactions.push({
          emoji: row.emoji,
          timestamp: row.reactionTime,
        });
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  // Calculate trending scores and sort
  const trendingRecipes = Object.values(recipeReactions)
    .map((recipe) => ({
      ...recipe,
      trendingScore: calculateTrendingScore(recipe.reactions),
    }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, TRENDING_LIMIT);

  // Cache the results in KV with expiration
  await ctx.recipeState.put(CACHE_KEY, JSON.stringify(trendingRecipes), {
    expirationTtl: CACHE_TTL,
  });

  return trendingRecipes;
});
