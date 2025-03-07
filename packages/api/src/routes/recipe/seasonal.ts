import { publicProcedure } from "../../trpc";
import { type EnglishRecipe, EnglishRecipesTable } from "../../db/schema/recipes";
import { eq } from "drizzle-orm";
import type { RecipeQueueMessage } from "../../types";
import type { Context } from "../../context";

// Define seasonal recipe names for each season
const seasonalRecipeNames = {
  spring: ["Spring Asparagus Risotto", "Strawberry Spinach Salad", "Fresh Herb Frittata"],
  summer: ["Grilled Peach Salad", "Lemon Basil Pasta", "Grilled Fish Tacos"],
  autumn: ["Butternut Squash Soup", "Pumpkin Risotto", "Maple Glazed Roasted Vegetables"],
  winter: ["Beef Bourguignon", "Creamy Potato Leek Soup", "Roasted Root Vegetables"],
};

// Helper function to check and queue recipe updates if needed
async function checkAndQueueRecipeUpdate(ctx: Context, recipe: EnglishRecipe) {
  // Only check completed recipes with data
  if (recipe.status === "completed" && recipe.data) {
    const needsImageUpdate = !recipe.imageUrl || recipe.imageUrl.trim() === "";
    const needsDescriptionUpdate = !recipe.description || recipe.description.trim() === "";

    // If either image or description is missing, queue an update
    if (needsImageUpdate || needsDescriptionUpdate) {
      try {
        const updateMessage: RecipeQueueMessage = {
          recipeId: recipe.id,
          updateImage: needsImageUpdate,
          updateDescription: needsDescriptionUpdate,
          type: "update",
        };

        await ctx.recipeQueue.send(updateMessage);
      } catch (error) {
        console.error("Failed to queue recipe update:", {
          error: (error as Error).message,
          recipeId: recipe.id,
        });
      }
    }
  }
}

// Determine current season based on the date with accurate season start/end dates
export function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();

  // Define season start dates for Northern Hemisphere
  const springStart = new Date(year, 2, 20); // March 20
  const summerStart = new Date(year, 5, 21); // June 21
  const autumnStart = new Date(year, 8, 22); // September 22
  const winterStart = new Date(year, 11, 21); // December 21

  // Check which season we're in
  if (now >= springStart && now < summerStart) return "spring";
  if (now >= summerStart && now < autumnStart) return "summer";
  if (now >= autumnStart && now < winterStart) return "autumn";

  // Handle winter spanning across years
  if (now >= winterStart || now < springStart) return "winter";

  // Default fallback
  return "spring";
}

export const getSeasonalRecipes = publicProcedure.query(async ({ ctx }) => {
  const currentSeason = getCurrentSeason();
  const recipeNames = seasonalRecipeNames[currentSeason];

  // First, get all recipes from the database to check against
  const allRecipes = await ctx.db.select().from(EnglishRecipesTable);

  // Filter recipes that match our seasonal recipes (case-insensitive)
  const allRecipesWithStatus = allRecipes.filter((recipe) => {
    // Check if the recipe name matches any of our seasonal recipe names (case-insensitive)
    const nameMatch = recipeNames.some((name) => recipe.name.toLowerCase() === name.toLowerCase());

    // Check if the recipe ID matches our seasonal pattern
    const idMatch = recipeNames.some((name) =>
      recipe.id.startsWith(`seasonal_${currentSeason}_${name.toLowerCase().replace(/\s+/g, "_")}`),
    );

    return nameMatch || idMatch;
  });

  // Create maps for tracking recipes (using lowercase names for case-insensitive matching)
  const existingRecipesByName = new Map(
    allRecipesWithStatus.map((recipe) => [recipe.name.toLowerCase(), recipe]),
  );

  const existingRecipeIds = new Set(allRecipesWithStatus.map((recipe) => recipe.id));

  // Check which recipes need to be generated (case-insensitive matching)
  const missingRecipes = recipeNames.filter(
    (name) => !existingRecipesByName.has(name.toLowerCase()),
  );

  // Check for recipes that are stuck in "generating" status
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

  const stuckRecipes = allRecipesWithStatus.filter((recipe) => {
    if (recipe.status !== "generating") return false;

    // Check if the recipe has been in "generating" status for more than 5 minutes
    const updatedAt = new Date(recipe.updatedAt);
    return updatedAt < fiveMinutesAgo;
  });

  if (stuckRecipes.length > 0) {
    // Re-queue stuck recipes
    for (const recipe of stuckRecipes) {
      try {
        // Find the original recipe name with proper capitalization
        const properName =
          recipeNames.find((name) => name.toLowerCase() === recipe.name.toLowerCase()) ||
          recipe.name;

        // Update the recipe's updatedAt timestamp
        await ctx.db
          .update(EnglishRecipesTable)
          .set({ updatedAt: now.toISOString() })
          .where(eq(EnglishRecipesTable.id, recipe.id));

        // Re-queue the recipe for generation
        await ctx.recipeQueue.send({
          recipeId: recipe.id,
          dishName: properName,
          type: "recipe",
          hasImage: true,
        });
      } catch (error) {
        console.error(`Failed to re-queue stuck recipe ${recipe.name}:`, error);
      }
    }
  }

  // Create and queue missing recipes for generation
  for (const recipeName of missingRecipes) {
    try {
      // Generate a unique ID for the recipe
      const recipeId = `seasonal_${currentSeason}_${recipeName.toLowerCase().replace(/\s+/g, "_")}`;

      // Skip if we already have a recipe with this ID (double-check)
      if (existingRecipeIds.has(recipeId)) {
        continue;
      }

      // Generate a slug for the recipe
      const slug = recipeName.toLowerCase().replace(/\s+/g, "-");

      // First, insert the recipe into the database with "generating" status
      await ctx.db.insert(EnglishRecipesTable).values({
        id: recipeId,
        name: recipeName.toLowerCase(), // Store name in lowercase for consistency
        slug: slug,
        status: "generating",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add required properties with null/default values
        data: null,
        movedToRecipeId: null,
        movedToSlug: null,
        errorMessage: null,
        searchQuery: recipeName,
        imageQuery: null,
        imageUrl: null,
        description: null,
        category: null,
        ratings: null,
        estimatedCosts: null,
      });

      // Then queue it for generation
      await ctx.recipeQueue.send({
        recipeId,
        dishName: recipeName,
        type: "recipe",
        // Ensure we generate images for seasonal recipes
        hasImage: true,
      });

      // Add the new recipe to our tracking maps so we don't try to create it again
      existingRecipeIds.add(recipeId);

      // Also add the newly created recipe to our allRecipesWithStatus array
      allRecipesWithStatus.push({
        id: recipeId,
        name: recipeName.toLowerCase(),
        slug: slug,
        status: "generating",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add required properties with null/default values
        data: null,
        movedToRecipeId: null,
        movedToSlug: null,
        errorMessage: null,
        searchQuery: recipeName,
        imageQuery: null,
        imageUrl: null,
        description: null,
        category: null,
        ratings: null,
        estimatedCosts: null,
      });
    } catch (error) {
      console.error(`Failed to create and queue seasonal recipe for ${recipeName}:`, error);
    }
  }

  // Filter to only get completed recipes for display
  const completedRecipes = allRecipesWithStatus.filter((recipe) => recipe.status === "completed");

  // Check if any completed recipes need updates (missing images, descriptions, etc.)
  for (const recipe of completedRecipes) {
    await checkAndQueueRecipeUpdate(ctx, recipe);
  }

  // Get recipes that are still generating
  const generatingRecipeNames = allRecipesWithStatus
    .filter((recipe) => recipe.status === "generating")
    .map((recipe) => {
      // Convert the lowercase stored name back to proper case for display
      const properName =
        recipeNames.find((name) => name.toLowerCase() === recipe.name.toLowerCase()) || recipe.name;

      return properName;
    });

  // Return the current season and available recipes
  return {
    season: currentSeason,
    recipes: completedRecipes.map((recipe) => {
      // Find the original recipe name with proper capitalization
      const properName =
        recipeNames.find((name) => name.toLowerCase() === recipe.name.toLowerCase()) || recipe.name;

      return {
        id: recipe.id,
        name: properName, // Use proper capitalization for display
        slug: recipe.slug,
        description: recipe.description || `A delicious ${currentSeason} recipe`,
        imageUrl: recipe.imageUrl,
        estimatedCosts: recipe.estimatedCosts,
        status: recipe.status,
        // Extract cooking time from recipe data if available
        cookingTime: recipe.data?.cookingTime || "30 minutes",
        // Extract difficulty from recipe data if available
        difficulty: recipe.data?.difficulty || "Medium",
      };
    }),
    pendingRecipes: missingRecipes,
    // Include recipes that are still generating
    generatingRecipes: generatingRecipeNames,
  };
});
