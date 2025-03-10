import { SearchSchema } from "../../../schemas/search";
import { publicProcedure } from "../../trpc";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { RecipeQueueMessage } from "../../types";
import { tryCatch } from "@dishify/app/utils/helpers";

const RECIPE_STATE_PREFIX = "recipe_state:";
const IMAGE_DATA_PREFIX = "image_data:";
const GENERATION_TIMEOUT = 60000; // 1 minute timeout
const MAX_DISH_NAME_LENGTH = 100; // Maximum length for dish name
const MAX_SLUG_LENGTH = 80; // Maximum length for slug

// Define return type for better type safety
const GenerateResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  status: z.enum(["generating", "completed", "error"]),
  errorMessage: z.string().optional(),
});

type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

/**
 * Generates a URL-friendly slug from a dish name
 * @param text The text to slugify (either dish name or search query)
 * @param id A unique identifier to append
 * @returns A URL-friendly slug
 */
function generateSlug(text: string, id: string): string {
  // Convert to lowercase and replace spaces and special characters with hyphens
  const baseSlug = text
    .toLowerCase()
    .trim()
    // Replace special characters with spaces
    .replace(/[^a-z0-9\s-]/g, " ")
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Limit the base slug length to leave room for the ID
    .slice(0, MAX_SLUG_LENGTH - id.length - 1);

  // Append first 8 characters of the ID to ensure uniqueness
  return `${baseSlug}-${id.slice(0, 8)}`;
}

export const generate = publicProcedure
  .input(SearchSchema)
  .mutation(async ({ ctx, input: { dishName, image, retryId } }) => {
    // Validate dish name length
    if (dishName && dishName.length > MAX_DISH_NAME_LENGTH) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Dish name must be ${MAX_DISH_NAME_LENGTH} characters or less`,
      });
    }

    // First check if recipe exists in database
    let existingRecipeId: string | null = null;

    // If we have a retryId, check that recipe first
    if (retryId) {
      const { data: retryingRecipe } = await tryCatch(
        ctx.db.select().from(EnglishRecipesTable).where(eq(EnglishRecipesTable.id, retryId)).get(),
      );

      if (retryingRecipe && retryingRecipe.status === "error") {
        existingRecipeId = retryingRecipe.id;
      }
    } else if (!image && dishName) {
      // First check if we're retrying a specific recipe
      const { data: retryingRecipe } = await tryCatch(
        ctx.db
          .select()
          .from(EnglishRecipesTable)
          .where(
            and(
              eq(EnglishRecipesTable.searchQuery, dishName),
              eq(EnglishRecipesTable.status, "error"),
            ),
          )
          .get(),
      );

      if (retryingRecipe) {
        // We found the specific recipe we're retrying
        existingRecipeId = retryingRecipe.id;
      } else {
        // Check for existing recipes with this name
        const { data: existingRecipe } = await tryCatch(
          ctx.db
            .select()
            .from(EnglishRecipesTable)
            .where(
              and(
                eq(EnglishRecipesTable.name, dishName.toLowerCase()),
                ne(EnglishRecipesTable.status, "moved"),
              ),
            )
            .get(),
        );

        if (existingRecipe) {
          if (existingRecipe.status === "completed") {
            return {
              id: existingRecipe.id,
              slug: existingRecipe.slug,
              status: "completed",
            } satisfies GenerateResponse;
          }

          // Check if recipe is stuck in generating state
          const { data: isGenerating } = await tryCatch(
            ctx.recipeState.get(RECIPE_STATE_PREFIX + existingRecipe.id),
          );

          // If recipe exists but is stuck in generating state, allow retrying
          if (existingRecipe.status === "generating" && !isGenerating) {
            // Recipe is stuck, update status to error and allow retry
            const { error: updateError } = await tryCatch(
              ctx.db
                .update(EnglishRecipesTable)
                .set({
                  status: "error",
                  errorMessage: "Recipe generation was interrupted. Please try again.",
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(EnglishRecipesTable.id, existingRecipe.id)),
            );

            if (updateError) {
              console.error("Failed to update stuck recipe status:", {
                error: updateError.message,
                recipeId: existingRecipe.id,
              });
            }

            existingRecipeId = existingRecipe.id;
          } else if (existingRecipe.status === "generating" && isGenerating) {
            // If recipe is currently being generated, return its ID and slug
            return {
              id: existingRecipe.id,
              slug: existingRecipe.slug,
              status: "generating",
            } satisfies GenerateResponse;
          } else if (existingRecipe.status === "moved") {
            // If recipe was moved, return the target recipe details
            if (!existingRecipe.movedToRecipeId || !existingRecipe.movedToSlug) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Recipe was moved but target recipe details are missing",
              });
            }
            return {
              id: existingRecipe.movedToRecipeId,
              slug: existingRecipe.movedToSlug,
              status: "completed",
            } satisfies GenerateResponse;
          } else if (existingRecipe.status === "error") {
            // If recipe is in error state, allow retry with same ID
            existingRecipeId = existingRecipe.id;
          }
        }

        // Also check if there's a completed recipe with this name that was moved
        const { data: movedRecipe } = await tryCatch(
          ctx.db
            .select()
            .from(EnglishRecipesTable)
            .where(
              and(
                eq(EnglishRecipesTable.name, dishName.toLowerCase()),
                eq(EnglishRecipesTable.status, "moved"),
              ),
            )
            .get(),
        );

        if (movedRecipe?.movedToRecipeId && movedRecipe?.movedToSlug) {
          // If we find a moved recipe, return the target recipe details
          return {
            id: movedRecipe.movedToRecipeId,
            slug: movedRecipe.movedToSlug,
            status: "completed",
          } satisfies GenerateResponse;
        }
      }
    }

    // Create a new recipe entry with 'generating' status
    const recipeId = existingRecipeId ?? createId();
    const initialSlug = generateSlug(dishName || `recipe-${recipeId}`, recipeId);
    const searchQuery =
      typeof dishName === "string" ? dishName.toLowerCase() : `recipe-${recipeId}`;

    // Check if this recipe is already being generated
    const { data: isGenerating } = await tryCatch(
      ctx.recipeState.get(RECIPE_STATE_PREFIX + recipeId),
    );

    if (isGenerating) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Recipe is already being generated. Please wait.",
      });
    }

    // For image queries, if we don't have the image data, set error status
    if (image === undefined && dishName === undefined) {
      const { error: insertError } = await tryCatch(
        ctx.db
          .insert(EnglishRecipesTable)
          .values({
            id: recipeId,
            name: `temp_${recipeId}`,
            slug: initialSlug,
            data: {
              dishName: dishName || `Recipe ${recipeId}`,
              cuisine: "Unknown",
              category: "Other",
              shoppingList: [],
              cookingTime: "",
              servings: "",
              instructions: [],
              difficulty: "Medium",
            },
            category: "Other",
            status: "error",
            errorMessage: "Image data was lost. Please try uploading the image again.",
            searchQuery,
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
          }),
      );

      if (insertError) {
        console.error("Failed to insert recipe with error status:", {
          error: insertError.message,
          recipeId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start recipe generation. Please try again.",
        });
      }

      return {
        id: recipeId,
        slug: initialSlug,
        status: "error" as const,
        errorMessage: "Image data was lost. Please try uploading the image again.",
      } satisfies GenerateResponse;
    }

    // Save initial recipe entry with generating status
    const { error: insertError } = await tryCatch(
      ctx.db
        .insert(EnglishRecipesTable)
        .values({
          id: recipeId,
          name: `temp_${recipeId}`,
          slug: initialSlug,
          data: {
            difficulty: "Medium",
            dishName: dishName || `Recipe ${recipeId}`,
            cuisine: "Unknown",
            category: "Other",
            shoppingList: [],
            cookingTime: "",
            servings: "",
            instructions: [],
          },
          category: "Other",
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
        }),
    );

    if (insertError) {
      console.error("Failed to insert initial recipe entry:", {
        error: insertError.message,
        recipeId,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to start recipe generation. Please try again.",
      });
    }

    // Add recipe to queue with just the reference - do this first to minimize latency
    const queueStartTime = Date.now();
    const queueMessage: RecipeQueueMessage = {
      recipeId,
      dishName,
      hasImage: !!image,
    };

    const { error: queueError } = await tryCatch(ctx.recipeQueue.send(queueMessage));
    const queueEndTime = Date.now();
    console.log(`Recipe queued in ${queueEndTime - queueStartTime}ms`, {
      recipeId,
      dishName,
      hasImage: !!image,
    });

    if (queueError) {
      console.error("Failed to add recipe to queue:", {
        error: queueError.message,
        recipeId,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to start recipe generation. Please try again.",
      });
    }

    // Since the recipe is already queued, we can now do these operations in parallel
    // which won't block the response to the client
    Promise.all([
      // Add to KV with expiration
      tryCatch(
        ctx.recipeState.put(RECIPE_STATE_PREFIX + recipeId, "true", {
          expirationTtl: Math.ceil(GENERATION_TIMEOUT / 1000), // Convert ms to seconds
        }),
      ).then(({ error: kvError }) => {
        if (kvError) {
          console.error("Failed to add recipe to KV state:", {
            error: kvError.message,
            recipeId,
          });
        }
      }),

      // Store image data in KV if present
      image
        ? tryCatch(
            ctx.recipeState.put(IMAGE_DATA_PREFIX + recipeId, JSON.stringify(image), {
              expirationTtl: Math.ceil(GENERATION_TIMEOUT / 1000),
            }),
          ).then(({ error: imageKvError }) => {
            if (imageKvError) {
              console.error("Failed to store image data in KV:", {
                error: imageKvError.message,
                recipeId,
              });
            }
          })
        : Promise.resolve(),
    ]).catch((error) => {
      // Just log errors here, as the recipe is already queued
      console.error("Error in background operations:", {
        error: error?.message || String(error),
        recipeId,
      });
    });

    // Return immediately with the recipe ID, slug and generating status
    return {
      id: recipeId,
      slug: initialSlug,
      status: "generating",
    } satisfies GenerateResponse;
  });
