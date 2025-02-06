import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { RecipeReactionsTable, EnglishRecipesTable } from "../../db/schema/recipes";
import { TRPCError } from "@trpc/server";

export const recipeReactionsRouter = router({
  getReactions: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First get the recipe ID from the slug
      const recipe = await ctx.db
        .select({ id: EnglishRecipesTable.id })
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.slug, input.slug))
        .get();

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      const reactions = await ctx.db
        .select()
        .from(RecipeReactionsTable)
        .where(eq(RecipeReactionsTable.recipeId, recipe.id))
        .all();

      // Get current user's reactions if they're authenticated
      const userReactions = ctx.user
        ? new Set(
            reactions
              .filter((reaction) => reaction.userId === ctx.user?.id)
              .map((reaction) => reaction.emoji),
          )
        : new Set<string>();

      // Return count and hasReacted for each emoji
      return reactions.reduce(
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
      const recipe = await ctx.db
        .select({ id: EnglishRecipesTable.id })
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.slug, input.slug))
        .get();

      if (!recipe) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      // Check if reaction already exists
      const existingReaction = await ctx.db
        .select()
        .from(RecipeReactionsTable)
        .where(
          and(
            eq(RecipeReactionsTable.recipeId, recipe.id),
            eq(RecipeReactionsTable.userId, user.id),
            eq(RecipeReactionsTable.emoji, input.emoji),
          ),
        )
        .get();

      if (existingReaction) {
        // Remove reaction
        await ctx.db
          .delete(RecipeReactionsTable)
          .where(eq(RecipeReactionsTable.id, existingReaction.id));
      } else {
        // Add reaction
        await ctx.db.insert(RecipeReactionsTable).values({
          recipeId: recipe.id,
          userId: user.id,
          emoji: input.emoji,
        });
      }
    }),
});
