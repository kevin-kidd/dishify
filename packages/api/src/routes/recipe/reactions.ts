import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { RecipeReactionsTable } from "../../db/schema/recipes";

export const recipeReactionsRouter = router({
  getReactions: publicProcedure
    .input(
      z.object({
        recipeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get reaction counts and user's reactions if logged in
      const reactions = await ctx.db
        .select({
          emoji: RecipeReactionsTable.emoji,
          count: sql<number>`count(*)`,
          hasReacted: sql<boolean>`max(case when ${RecipeReactionsTable.userId} = ${
            ctx.user?.id ?? ""
          } then 1 else 0 end)`,
        })
        .from(RecipeReactionsTable)
        .where(eq(RecipeReactionsTable.recipeId, input.recipeId))
        .groupBy(RecipeReactionsTable.emoji);

      return reactions.map((r) => ({
        emoji: r.emoji,
        count: r.count,
        hasReacted: Boolean(r.hasReacted),
        timestamp: Date.now(), // Added for UI sorting
      }));
    }),

  toggleReaction: protectedProcedure
    .input(
      z.object({
        recipeId: z.string(),
        emoji: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has already reacted with this emoji
      const existingReaction = await ctx.db
        .select()
        .from(RecipeReactionsTable)
        .where(
          and(
            eq(RecipeReactionsTable.recipeId, input.recipeId),
            eq(RecipeReactionsTable.userId, ctx.user.id),
            eq(RecipeReactionsTable.emoji, input.emoji),
          ),
        )
        .get();

      if (existingReaction) {
        // Remove reaction if it exists
        await ctx.db
          .delete(RecipeReactionsTable)
          .where(eq(RecipeReactionsTable.id, existingReaction.id));
        return { added: false };
      }
      // Add new reaction
      await ctx.db.insert(RecipeReactionsTable).values({
        recipeId: input.recipeId,
        userId: ctx.user.id,
        emoji: input.emoji,
      });
      return { added: true };
    }),
});
