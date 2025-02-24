import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { RecipeReactionsTable, EnglishRecipesTable } from "../../db/schema/recipes";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "@dishify/app/utils/helpers";

export const recipeReactionsRouter = router({
  getReactions: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First get the recipe ID from the slug
      const { data: recipe, error: recipeError } = await tryCatch(
        ctx.db
          .select({ id: EnglishRecipesTable.id })
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.slug, input.slug))
          .get(),
      );

      if (recipeError) {
        console.error("Failed to fetch recipe for reactions:", {
          error: recipeError.message,
          slug: input.slug,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recipe reactions",
        });
      }

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      const { data: reactions, error: reactionsError } = await tryCatch(
        ctx.db
          .select()
          .from(RecipeReactionsTable)
          .where(eq(RecipeReactionsTable.recipeId, recipe.id))
          .all(),
      );

      if (reactionsError) {
        console.error("Failed to fetch reactions:", {
          error: reactionsError.message,
          recipeId: recipe.id,
          slug: input.slug,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recipe reactions",
        });
      }

      // Get current user's reactions if they're authenticated
      const userReactions = ctx.user
        ? new Set(
            (reactions || [])
              .filter((reaction) => reaction.userId === ctx.user?.id)
              .map((reaction) => reaction.emoji),
          )
        : new Set<string>();

      // Return count and hasReacted for each emoji
      return (reactions || []).reduce(
        (acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              count: 0,
              hasReacted: userReactions.has(reaction.emoji),
            };
          }
          acc[reaction.emoji].count++;
          return acc;
        },
        {} as Record<string, { count: number; hasReacted: boolean }>,
      );
    }),

  toggleReaction: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        emoji: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to react to recipes",
        });
      }

      // First get the recipe ID from the slug
      const { data: recipe, error: recipeError } = await tryCatch(
        ctx.db
          .select({ id: EnglishRecipesTable.id })
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.slug, input.slug))
          .get(),
      );

      if (recipeError) {
        console.error("Failed to fetch recipe for reaction toggle:", {
          error: recipeError.message,
          slug: input.slug,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle reaction",
        });
      }

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      // Check if reaction already exists
      const { data: existingReaction, error: existingReactionError } = await tryCatch(
        ctx.db
          .select()
          .from(RecipeReactionsTable)
          .where(
            and(
              eq(RecipeReactionsTable.recipeId, recipe.id),
              eq(RecipeReactionsTable.userId, user.id),
              eq(RecipeReactionsTable.emoji, input.emoji),
            ),
          )
          .get(),
      );

      if (existingReactionError) {
        console.error("Failed to check existing reaction:", {
          error: existingReactionError.message,
          recipeId: recipe.id,
          userId: user.id,
          emoji: input.emoji,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle reaction",
        });
      }

      if (existingReaction) {
        // Remove reaction
        const { error: deleteError } = await tryCatch(
          ctx.db
            .delete(RecipeReactionsTable)
            .where(eq(RecipeReactionsTable.id, existingReaction.id)),
        );

        if (deleteError) {
          console.error("Failed to delete reaction:", {
            error: deleteError.message,
            reactionId: existingReaction.id,
            userId: user.id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove reaction",
          });
        }
      } else {
        // Add reaction
        const { error: insertError } = await tryCatch(
          ctx.db.insert(RecipeReactionsTable).values({
            recipeId: recipe.id,
            userId: user.id,
            emoji: input.emoji,
          }),
        );

        if (insertError) {
          console.error("Failed to add reaction:", {
            error: insertError.message,
            recipeId: recipe.id,
            userId: user.id,
            emoji: input.emoji,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add reaction",
          });
        }
      }
    }),
});
