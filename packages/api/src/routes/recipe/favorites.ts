import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { EnglishRecipesTable, FavoritesTable } from "../../db/schema/recipes";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const toggleFavorite = protectedProcedure
  .input(
    z.object({
      recipeId: z.string(),
      recipe: z.any(), // We store the entire recipe object for versioning
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { db, user } = ctx;
    const { recipeId, recipe } = input;

    // Check if recipe exists
    const existingRecipe = await db.query.EnglishRecipesTable.findFirst({
      where: eq(EnglishRecipesTable.id, recipeId),
    });

    if (!existingRecipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // Check if already favorited
    const existingFavorite = await db.query.FavoritesTable.findFirst({
      where: and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, recipeId)),
    });

    if (existingFavorite) {
      // Remove favorite
      await db
        .delete(FavoritesTable)
        .where(and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, recipeId)));

      return {
        favorited: false,
      };
    }

    // Add favorite
    await db.insert(FavoritesTable).values({
      userId: user.id,
      recipeId,
      recipeData: recipe,
    });

    return {
      favorited: true,
    };
  });

export const getFavorites = protectedProcedure.query(async ({ ctx }) => {
  const { db, user } = ctx;

  const favorites = await db.query.FavoritesTable.findMany({
    where: eq(FavoritesTable.userId, user.id),
  });

  return favorites;
});

export const isFavorited = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { db, user } = ctx;
    const { id } = input;

    const favorite = await db.query.FavoritesTable.findFirst({
      where: and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, id)),
    });

    return !!favorite;
  });

export const recipeFavoritesRouter = router({
  toggleFavorite,
  getFavorites,
  isFavorited,
});
