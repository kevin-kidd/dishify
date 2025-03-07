import { count, desc, eq, sql } from "drizzle-orm";
import {
  EnglishRecipesTable,
  FeaturedRecipeTable,
  RecipeReactionsTable,
  type FeaturedRecipe,
  type EnglishRecipe,
} from "../db/schema/recipes";
import { tryCatch } from "@dishify/app/utils/helpers";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import type { RecipeResponse } from "../../schemas/recipe-response";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import type { Bindings } from "../types";
import { createGroq } from "@ai-sdk/groq";

const CACHE_KEY = "featured-recipe";
const CACHE_TTL = 86400; // 24 hours in seconds
const FEATURED_RECIPE_STATE_PREFIX = "featured_recipe_state:";
const POSITIVE_EMOJIS = ["👍", "❤️", "🔥", "😋", "😍"];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Type for the featured recipe response
export type FeaturedRecipeResponse = {
  id: string;
  recipeId: string;
};

/**
 * Generates a featured recipe in the background via queue processing
 */
export async function generateFeaturedRecipe(
  env: Bindings,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
): Promise<void> {
  const startTime = Date.now();
  const recipeState = env.RECIPE_STATE;

  try {
    // Set generation in progress flag
    await recipeState.put(`${FEATURED_RECIPE_STATE_PREFIX}generating`, "true", {
      expirationTtl: 300, // 5 min TTL
    });

    // Step 1: Find the recipe with the most positive reactions in the last 24 hours
    const yesterday = new Date(Date.now() - ONE_DAY_MS).toISOString();

    // Count positive reactions by recipe from the last 24 hours
    const { data: recipeReactions, error: reactionsError } = await tryCatch(
      db
        .select({
          recipeId: RecipeReactionsTable.recipeId,
          reactionCount: count(),
        })
        .from(RecipeReactionsTable)
        .where(
          sql`${RecipeReactionsTable.createdAt} >= ${yesterday} AND ${RecipeReactionsTable.emoji} IN (${POSITIVE_EMOJIS.join(", ")})`,
        )
        .groupBy(RecipeReactionsTable.recipeId)
        .orderBy(desc(sql`reactionCount`))
        .limit(10)
        .all(),
    );

    let selectedRecipeId: string | null = null;

    if (
      recipeReactions &&
      Array.isArray(recipeReactions) &&
      recipeReactions.length > 0 &&
      !reactionsError
    ) {
      // Take the recipe with the most positive reactions
      const topReaction = recipeReactions[0] as { recipeId: string; reactionCount: number };
      selectedRecipeId = topReaction.recipeId;
    } else {
      // If no reactions found, select a random recipe
      const { data: randomRecipe, error: randomError } = await tryCatch(
        db
          .select()
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.status, "completed"))
          .orderBy(sql`RANDOM()`)
          .limit(1)
          .get(),
      );

      if (randomRecipe && !randomError) {
        const typedRandomRecipe = randomRecipe as EnglishRecipe;
        selectedRecipeId = typedRandomRecipe.id;
      } else {
        throw new Error("Failed to select a random recipe");
      }
    }

    if (!selectedRecipeId) {
      throw new Error("Failed to select a recipe for featuring");
    }

    // Step 2: Create the featured recipe entry using just the recipe ID
    const { data: newFeaturedRecipe, error: insertError } = await tryCatch(
      db
        .insert(FeaturedRecipeTable)
        .values({
          recipeId: selectedRecipeId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning()
        .get(),
    );

    if (!newFeaturedRecipe || insertError) {
      throw new Error(`Failed to insert featured recipe: ${insertError?.message}`);
    }

    const typedNewFeaturedRecipe = newFeaturedRecipe as FeaturedRecipe;

    // Step 3: Update the KV cache with just the ID reference
    const response: FeaturedRecipeResponse = {
      id: typedNewFeaturedRecipe.id,
      recipeId: typedNewFeaturedRecipe.recipeId,
    };

    await recipeState.put(CACHE_KEY, JSON.stringify(response), { expirationTtl: CACHE_TTL });

    const duration = Date.now() - startTime;
    console.log(`Featured recipe generation completed in ${duration}ms`, {
      recipeId: selectedRecipeId,
      featuredRecipeId: typedNewFeaturedRecipe.id,
    });
  } catch (error) {
    console.error("Featured recipe generation failed", error);
  } finally {
    // Clear the generation in progress flag
    await recipeState.delete(`${FEATURED_RECIPE_STATE_PREFIX}generating`);
  }
}

// Generate an engaging description for the recipe using AI
async function generateRecipeDescription(
  dishName: string,
  cuisine: RecipeResponse["cuisine"],
  env: Bindings,
): Promise<string> {
  try {
    const prompt = `Write an engaging and appetizing description for ${dishName}, a ${cuisine} dish. 
    The description should be enticing and make the reader want to try the recipe. 
    Keep it to a maximum of 2 sentences and focus on what makes this dish special.
    Do not exceed 200 characters in length.`;

    const groq = createGroq({
      apiKey: env.GROQ_API_KEY,
    });

    const { data: groqResponse, error: groqError } = await tryCatch(
      generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
      }),
    );

    if (groqResponse && !groqError) {
      return groqResponse.text.trim();
    }
  } catch (error) {
    console.error("Failed to generate recipe description using Groq", error);
  }

  try {
    // Fallback to CloudFlare Workers AI
    const workersAi = createWorkersAI({ binding: env.AI });

    const prompt = `Write an engaging and appetizing description for ${dishName}, a ${cuisine} dish. 
    The description should be enticing and make the reader want to try the recipe. 
    Keep it to a maximum of 2 sentences and focus on what makes this dish special.
    Do not exceed 200 characters in length.`;

    const { data: workersResponse, error: workersError } = await tryCatch(
      generateText({
        model: workersAi("@cf/meta/llama-3.1-8b-instruct"),
        prompt,
      }),
    );

    if (workersResponse && !workersError) {
      return workersResponse.text.trim();
    }

    // Last resort fallback
    return `A delightful ${cuisine} dish that will tantalize your taste buds. ${dishName} is perfect for any occasion and sure to impress.`;
  } catch (error) {
    console.error(
      "Failed to generate recipe description for both Groq and Cloudflare Workers AI",
      error,
    );
    return `A delightful ${cuisine} dish that will tantalize your taste buds. ${dishName} is perfect for any occasion and sure to impress.`;
  }
}

// Generate an image for the recipe using Cloudflare Workers AI
async function generateRecipeImage(
  dishName: string,
  cuisine: RecipeResponse["cuisine"],
  env: Bindings,
): Promise<string> {
  try {
    const prompt = `High resolution photo of ${dishName}, a ${cuisine} dish, presented nicely, as if it was made in a michelin star restaurant. Food photography with professional lighting, on elegant dinnerware.`;

    // Generate image using Cloudflare Workers AI
    const imageResponse = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });

    if (!imageResponse || !imageResponse.image) {
      throw new Error("Failed to generate image: Empty response");
    }

    // In real implementation, we would convert the base64 image and upload to Cloudflare Images
    // For now, we're returning the base64 data directly for demonstration
    const imageUrl = `data:image/jpeg;base64,${imageResponse.image}`;

    return imageUrl;
  } catch (error) {
    console.error("Failed to generate recipe image", error);
    // Fallback to a generic food image
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(dishName)}`;
  }
}
