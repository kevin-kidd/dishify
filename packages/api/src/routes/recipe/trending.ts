import type { z } from "zod";
import { publicProcedure } from "../../trpc";
import {
  TrendingRecipesTable,
  TrendingStatusTable,
  type EstimatedCosts,
} from "../../db/schema/recipes";
import type { RecipeResponseSchema } from "../../../schemas/recipe-response";
import { tryCatch } from "@dishify/app/utils/helpers";
import type { Context } from "../../context";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

// Define the trending recipe type using schema-defined types
export type TrendingRecipe = {
  id: string;
  slug: string;
  data: NonNullable<z.infer<typeof RecipeResponseSchema>>;
  trendingScore: number;
  estimatedCost: EstimatedCosts[keyof EstimatedCosts] | null;
};

// Maximum time a refresh can be in progress before we consider it stuck (10 minutes)
const MAX_REFRESH_DURATION_MS = 10 * 60 * 1000;

/**
 * Checks if a trending refresh is needed and queues a refresh job if necessary
 * Returns true if a refresh was queued, false otherwise
 */
const checkAndQueueRefresh = async (ctx: Context): Promise<boolean> => {
  console.log("Queueing trending refresh job");

  const { error: queueError } = await tryCatch(
    ctx.recipeQueue.send({
      recipeId: "trending",
      type: "trending-refresh",
      timestamp: Date.now(),
    }),
  );

  if (queueError) {
    console.error("Failed to queue trending refresh:", {
      error: queueError.message,
    });
    return false;
  }

  console.log("Successfully queued trending refresh");
  return true;
};

export const trending = publicProcedure.query(async ({ ctx }): Promise<TrendingRecipe[]> => {
  console.log("Fetching trending recipes");

  const { data: trendingRows, error: dbError } = await tryCatch(
    ctx.db.select().from(TrendingRecipesTable).orderBy(desc(TrendingRecipesTable.rank)).limit(20),
  );

  if (dbError) {
    console.error("Failed to fetch trending recipes from database:", {
      error: dbError.message,
    });
    await checkAndQueueRefresh(ctx);
    return [];
  }

  const cacheExpired =
    !trendingRows ||
    trendingRows.length === 0 ||
    (trendingRows[0].updatedAt &&
      Date.now() - new Date(trendingRows[0].updatedAt).getTime() > 5 * 60 * 1000);

  if (cacheExpired) {
    console.log("Trending recipes cache expired or empty, queueing refresh");
    await checkAndQueueRefresh(ctx);
  }

  if (trendingRows && trendingRows.length > 0) {
    return trendingRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      data: row.data as NonNullable<z.infer<typeof RecipeResponseSchema>>,
      trendingScore: row.trendingScore,
      estimatedCost: row.estimatedCost as EstimatedCosts[keyof EstimatedCosts] | null,
    }));
  }

  return [];
});
