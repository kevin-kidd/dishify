import type { DrizzleD1Database } from "drizzle-orm/d1";
import { EnglishRecipesTable } from "../db/schema/recipes";
import { eq } from "drizzle-orm";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import type { Bindings, RecipeQueueMessage } from "../types";
import { tryCatch } from "@dishify/app/utils/helpers";
import { generateRecipeDescription, generateRecipeImage } from "./generate";

/**
 * Updates a recipe with missing image or description
 * This function is called by the queue worker when a recipe is found to be missing
 * an image or description during a get request
 */
export async function updateRecipe(
  { recipeId, updateImage, updateDescription }: RecipeQueueMessage,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  env: Bindings,
) {
  console.log("Starting recipe update:", {
    recipeId,
    updateImage,
    updateDescription,
  });

  // Fetch the recipe to get necessary data for generation
  const { data: recipe, error: recipeError } = await tryCatch(
    db.select().from(EnglishRecipesTable).where(eq(EnglishRecipesTable.id, recipeId)).get(),
  );

  if (recipeError || !recipe) {
    console.error("Failed to fetch recipe for update:", {
      error: recipeError?.message || "Recipe not found",
      recipeId,
    });
    return;
  }

  // Skip if recipe is not completed
  if (recipe.status !== "completed") {
    console.log("Skipping update for non-completed recipe:", {
      recipeId,
      status: recipe.status,
    });
    return;
  }

  // Skip if recipe doesn't have data
  if (!recipe.data) {
    console.log("Skipping update for recipe without data:", {
      recipeId,
    });
    return;
  }

  const updateData: Partial<typeof recipe> = {
    updatedAt: new Date().toISOString(),
  };

  // Generate description if needed
  if (updateDescription && (!recipe.description || recipe.description.trim() === "")) {
    try {
      if (recipe.data.shoppingList && Array.isArray(recipe.data.shoppingList)) {
        const description = await generateRecipeDescription(
          recipe.data.dishName,
          recipe.data.cuisine,
          recipe.data.shoppingList,
          env,
        );

        if (description) {
          updateData.description = description;
          console.log("Generated description for recipe:", {
            recipeId,
            description,
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate description:", {
        error: (error as Error).message,
        recipeId,
      });
    }
  }

  // Generate image if needed
  if (updateImage && (!recipe.imageUrl || recipe.imageUrl.trim() === "")) {
    try {
      const imageUrl = await generateRecipeImage(recipe.data.dishName, recipe.data.cuisine, env);

      if (imageUrl) {
        updateData.imageUrl = imageUrl;
        console.log("Generated image for recipe:", {
          recipeId,
          imageUrl,
        });
      }
    } catch (error) {
      console.error("Failed to generate image:", {
        error: (error as Error).message,
        recipeId,
      });
    }
  }

  // Update the recipe if we have changes
  if (Object.keys(updateData).length > 1) {
    // More than just updatedAt
    const { error: updateError } = await tryCatch(
      db.update(EnglishRecipesTable).set(updateData).where(eq(EnglishRecipesTable.id, recipeId)),
    );

    if (updateError) {
      console.error("Failed to update recipe:", {
        error: updateError.message,
        recipeId,
      });
    } else {
      console.log("Successfully updated recipe:", {
        recipeId,
        updatedFields: Object.keys(updateData).filter((key) => key !== "updatedAt"),
      });
    }
  } else {
    console.log("No updates needed for recipe:", {
      recipeId,
    });
  }
}
