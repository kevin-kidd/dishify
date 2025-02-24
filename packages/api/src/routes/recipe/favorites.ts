import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { EnglishRecipesTable, FavoritesTable } from "../../db/schema/recipes";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "@dishify/app/utils/helpers";

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
    const { data: existingRecipe, error: recipeError } = await tryCatch(
      db.query.EnglishRecipesTable.findFirst({
        where: eq(EnglishRecipesTable.id, recipeId),
      }),
    );

    if (recipeError) {
      console.error("Failed to check if recipe exists:", {
        error: recipeError.message,
        recipeId,
        userId: user.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to toggle favorite status",
      });
    }

    if (!existingRecipe) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Recipe not found",
      });
    }

    // Check if already favorited
    const { data: existingFavorite, error: favoriteError } = await tryCatch(
      db.query.FavoritesTable.findFirst({
        where: and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, recipeId)),
      }),
    );

    if (favoriteError) {
      console.error("Failed to check if recipe is already favorited:", {
        error: favoriteError.message,
        recipeId,
        userId: user.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to toggle favorite status",
      });
    }

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await tryCatch(
        db
          .delete(FavoritesTable)
          .where(and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, recipeId))),
      );

      if (deleteError) {
        console.error("Failed to remove favorite:", {
          error: deleteError.message,
          recipeId,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove from favorites",
        });
      }

      return {
        favorited: false,
      };
    }

    // Add favorite
    const { error: insertError } = await tryCatch(
      db.insert(FavoritesTable).values({
        userId: user.id,
        recipeId,
        recipeData: recipe,
      }),
    );

    if (insertError) {
      console.error("Failed to add favorite:", {
        error: insertError.message,
        recipeId,
        userId: user.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add to favorites",
      });
    }

    return {
      favorited: true,
    };
  });

export const getFavorites = protectedProcedure.query(async ({ ctx }) => {
  const { db, user } = ctx;

  const { data: favorites, error } = await tryCatch(
    db.query.FavoritesTable.findMany({
      where: eq(FavoritesTable.userId, user.id),
    }),
  );

  if (error) {
    console.error("Failed to fetch favorites:", {
      error: error.message,
      userId: user.id,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch favorites",
    });
  }

  return favorites || [];
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

    const { data: favorite, error } = await tryCatch(
      db.query.FavoritesTable.findFirst({
        where: and(eq(FavoritesTable.userId, user.id), eq(FavoritesTable.recipeId, id)),
      }),
    );

    if (error) {
      console.error("Failed to check if recipe is favorited:", {
        error: error.message,
        recipeId: id,
        userId: user.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check favorite status",
      });
    }

    return !!favorite;
  });

export const recipeFavoritesRouter = router({
  toggleFavorite,
  getFavorites,
  isFavorited,
});
