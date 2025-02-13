import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { eq } from "drizzle-orm";

const RECIPE_STATE_PREFIX = "recipe_state:";
const STALE_TIMEOUT = 15000; // 15 seconds

export const getRecipe = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const recipe = await ctx.db
      .select()
      .from(EnglishRecipesTable)
      .where(eq(EnglishRecipesTable.id, input.id))
      .get();

    if (!recipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // If recipe is in generating state, check if it's actually being generated
    if (recipe.status === "generating") {
      const isGenerating = await ctx.recipeState.get(RECIPE_STATE_PREFIX + input.id);

      // If not in KV state and it's been more than 15 seconds, add back to queue
      if (!isGenerating) {
        const updatedAt = new Date(recipe.updatedAt).getTime();
        const now = Date.now();

        if (now - updatedAt > STALE_TIMEOUT) {
          console.log("Recipe generation appears stale, re-queueing:", {
            recipeId: input.id,
            updatedAt: recipe.updatedAt,
          });

          // Add back to queue
          await ctx.recipeQueue.send({
            recipeId: input.id,
            dishName: recipe.searchQuery || undefined,
            hasImage: false, // Don't retry image-based recipes automatically
          });
        }
      }
    }

    return recipe;
  });

export const getRecipeBySlug = publicProcedure
  .input(
    z.object({
      slug: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const recipe = await ctx.db
      .select()
      .from(EnglishRecipesTable)
      .where(eq(EnglishRecipesTable.slug, input.slug))
      .get();

    if (!recipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // If recipe is in generating state, check if it's actually being generated
    if (recipe.status === "generating") {
      const isGenerating = await ctx.recipeState.get(RECIPE_STATE_PREFIX + recipe.id);

      // If not in KV state and it's been more than 15 seconds, add back to queue
      if (!isGenerating) {
        const updatedAt = new Date(recipe.updatedAt).getTime();
        const now = Date.now();

        if (now - updatedAt > STALE_TIMEOUT) {
          console.log("Recipe generation appears stale, re-queueing:", {
            recipeId: recipe.id,
            updatedAt: recipe.updatedAt,
          });

          // Add back to queue
          await ctx.recipeQueue.send({
            recipeId: recipe.id,
            dishName: recipe.searchQuery || undefined,
            hasImage: false, // Don't retry image-based recipes automatically
          });
        }
      }
    }

    return recipe;
  });
