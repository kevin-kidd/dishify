import { SearchSchema } from "../../../schemas/search";
import { publicProcedure } from "../../trpc";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, ne } from "drizzle-orm";

const RECIPE_STATE_PREFIX = "recipe_state:";
const GENERATION_TIMEOUT = 60000; // 1 minute timeout

export const generate = publicProcedure
  .input(SearchSchema)
  .mutation(async ({ ctx, input: { dishName, image, retryId } }) => {
    // First check if recipe exists in database
    let existingRecipeId: string | null = null;

    // If we have a retryId, check that recipe first
    if (retryId) {
      const retryingRecipe = await ctx.db
        .select()
        .from(EnglishRecipesTable)
        .where(eq(EnglishRecipesTable.id, retryId))
        .get();

      if (retryingRecipe && retryingRecipe.status === "error") {
        existingRecipeId = retryingRecipe.id;
      }
    } else if (!image && dishName) {
      // First check if we're retrying a specific recipe
      const retryingRecipe = await ctx.db
        .select()
        .from(EnglishRecipesTable)
        .where(
          and(
            eq(EnglishRecipesTable.searchQuery, dishName),
            eq(EnglishRecipesTable.status, "error"),
          ),
        )
        .get();

      if (retryingRecipe) {
        // We found the specific recipe we're retrying
        existingRecipeId = retryingRecipe.id;
      } else {
        // Check for existing recipes with this name
        const existingRecipe = await ctx.db
          .select()
          .from(EnglishRecipesTable)
          .where(
            and(
              eq(EnglishRecipesTable.name, dishName.toLowerCase()),
              ne(EnglishRecipesTable.status, "moved"),
            ),
          )
          .get();

        if (existingRecipe) {
          if (existingRecipe.status === "completed") {
            return {
              id: existingRecipe.id,
              status: "completed",
            };
          }

          // Check if recipe is stuck in generating state
          const isGenerating = await ctx.recipeState.get(RECIPE_STATE_PREFIX + existingRecipe.id);

          // If recipe exists but is stuck in generating state, allow retrying
          if (existingRecipe.status === "generating" && !isGenerating) {
            // Recipe is stuck, update status to error and allow retry
            await ctx.db
              .update(EnglishRecipesTable)
              .set({
                status: "error",
                errorMessage: "Recipe generation was interrupted. Please try again.",
                updatedAt: new Date().toISOString(),
              })
              .where(eq(EnglishRecipesTable.id, existingRecipe.id));

            existingRecipeId = existingRecipe.id;
          } else if (existingRecipe.status === "generating" && isGenerating) {
            // If recipe is currently being generated, return its ID
            return {
              id: existingRecipe.id,
              status: "generating",
            };
          } else if (existingRecipe.status === "moved") {
            // If recipe was moved, return the target recipe ID
            if (!existingRecipe.movedToRecipeId) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Recipe was moved but target recipe ID is missing",
              });
            }
            return {
              id: existingRecipe.movedToRecipeId,
              status: "completed",
            };
          } else if (existingRecipe.status === "error") {
            // If recipe is in error state, allow retry with same ID
            existingRecipeId = existingRecipe.id;
          }
        }

        // Also check if there's a completed recipe with this name that was moved
        const movedRecipe = await ctx.db
          .select()
          .from(EnglishRecipesTable)
          .where(
            and(
              eq(EnglishRecipesTable.name, dishName.toLowerCase()),
              eq(EnglishRecipesTable.status, "moved"),
            ),
          )
          .get();

        if (movedRecipe?.movedToRecipeId) {
          // If we find a moved recipe, return the target recipe ID
          return {
            id: movedRecipe.movedToRecipeId,
            status: "completed",
          };
        }
      }
    }

    // Create a new recipe entry with 'generating' status
    const recipeId = existingRecipeId ?? createId();

    try {
      // Check if this recipe is already being generated
      const isGenerating = await ctx.recipeState.get(RECIPE_STATE_PREFIX + recipeId);
      if (isGenerating) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Recipe is already being generated. Please wait.",
        });
      }

      // For image queries, if we don't have the image data, set error status
      if (image === undefined && dishName === undefined) {
        await ctx.db
          .insert(EnglishRecipesTable)
          .values({
            id: recipeId,
            name: `temp_${recipeId}`,
            data: {
              dishName: `temp_${recipeId}`,
              cuisine: "Unknown",
              shoppingList: [],
              cookingTime: "",
              servings: "",
              instructions: [],
            },
            status: "error",
            errorMessage: "Image data was lost. Please try uploading the image again.",
            searchQuery: null,
            imageQuery: "true",
            updatedAt: new Date().toISOString(),
            ratings: [],
          })
          .onConflictDoUpdate({
            target: [EnglishRecipesTable.id],
            set: {
              status: "error",
              errorMessage: "Image data was lost. Please try uploading the image again.",
            },
          });

        return {
          id: recipeId,
          status: "error" as const,
          errorMessage: "Image data was lost. Please try uploading the image again.",
        };
      }

      // Save initial recipe entry with generating status
      await ctx.db
        .insert(EnglishRecipesTable)
        .values({
          id: recipeId,
          name: `temp_${recipeId}`, // Use a temporary unique name
          data: {
            dishName: `temp_${recipeId}`,
            cuisine: "Unknown",
            shoppingList: [], // Empty array, will be stored as JSON
            cookingTime: "",
            servings: "",
            instructions: [],
          },
          status: "generating",
          searchQuery: dishName || null,
          imageQuery: image ? "true" : null,
          updatedAt: new Date().toISOString(),
          ratings: [],
        })
        .onConflictDoUpdate({
          target: [EnglishRecipesTable.id],
          set: {
            status: "generating",
            updatedAt: new Date().toISOString(),
          },
        });

      // Add to KV with expiration
      await ctx.recipeState.put(RECIPE_STATE_PREFIX + recipeId, "true", {
        expirationTtl: Math.ceil(GENERATION_TIMEOUT / 1000), // Convert ms to seconds
      });

      // Add to queue
      await ctx.env.RECIPE_QUEUE.send({
        recipeId,
        dishName,
        image,
      });

      // Return immediately with the recipe ID and generating status
      return {
        id: recipeId,
        status: "generating",
      };
    } catch (error) {
      // Clean up if initial save fails
      await ctx.recipeState.delete(RECIPE_STATE_PREFIX + recipeId);
      console.error("Failed to create initial recipe entry", {
        error,
        query: dishName || "image",
        recipeId,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to start recipe generation. Please try again.",
      });
    }
  });
