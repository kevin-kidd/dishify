import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { eq } from "drizzle-orm";
import { tryCatch } from "@dishify/app/utils/helpers";

const RECIPE_STATE_PREFIX = "recipe_state:";
const STALE_TIMEOUT = 15000; // 15 seconds

export const getRecipe = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const { data: recipe, error: recipeError } = await tryCatch(
      ctx.db.select().from(EnglishRecipesTable).where(eq(EnglishRecipesTable.id, input.id)).get(),
    );

    if (recipeError) {
      console.error("Failed to fetch recipe:", {
        error: recipeError.message,
        recipeId: input.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch recipe",
      });
    }

    if (!recipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // If recipe is in generating state, check if it's actually being generated
    if (recipe.status === "generating") {
      const { data: isGenerating } = await tryCatch(
        ctx.recipeState.get(RECIPE_STATE_PREFIX + input.id),
      );

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
          const { error: queueError } = await tryCatch(
            ctx.recipeQueue.send({
              recipeId: input.id,
              dishName: recipe.searchQuery || undefined,
              hasImage: false, // Don't retry image-based recipes automatically
            }),
          );

          if (queueError) {
            console.error("Failed to re-queue stale recipe:", {
              error: queueError.message,
              recipeId: input.id,
            });
          }
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
    const { data: recipe, error: recipeError } = await tryCatch(
      ctx.db
        .select()
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.slug, input.slug))
        .get(),
    );

    if (recipeError) {
      console.error("Failed to fetch recipe by slug:", {
        error: recipeError.message,
        slug: input.slug,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch recipe",
      });
    }

    if (!recipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // If recipe is in generating state, check if it's actually being generated
    if (recipe.status === "generating") {
      const { data: isGenerating } = await tryCatch(
        ctx.recipeState.get(RECIPE_STATE_PREFIX + recipe.id),
      );

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
          const { error: queueError } = await tryCatch(
            ctx.recipeQueue.send({
              recipeId: recipe.id,
              dishName: recipe.searchQuery || undefined,
              hasImage: false, // Don't retry image-based recipes automatically
            }),
          );

          if (queueError) {
            console.error("Failed to re-queue stale recipe:", {
              error: queueError.message,
              recipeId: recipe.id,
            });
          }
        }
      }
    }

    return recipe;
  });
