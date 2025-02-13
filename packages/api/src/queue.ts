import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Ai, BaseAiTextGenerationModels } from "@cloudflare/workers-types";
import { EnglishRecipeNameTable, EnglishRecipesTable } from "./db/schema/recipes";
import { eq, and, ne } from "drizzle-orm";
import { type RecipeResponse, RecipeResponseSchema } from "../schemas/recipe-response";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateObject } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import type * as recipeSchema from "./db/schema/recipes";
import type * as userSchema from "./db/schema/user";

const RECIPE_STATE_PREFIX = "recipe_state:";

interface Env {
  DB: D1Database;
  AI: Ai;
  GROQ_API_KEY: string;
  ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  RECIPE_STATE: KVNamespace;
}

export async function generateRecipe(
  recipeId: string,
  dishName: string | undefined,
  image: number[] | undefined,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  env: Env,
) {
  let provider = "groq";
  const startTime = Date.now();

  try {
    console.log("Starting recipe generation:", {
      recipeId,
      dishName,
      hasImage: !!image,
      provider,
    });

    let recipeResponse: RecipeResponse | null | string = null;
    const systemPrompt =
      "You are a helpful assistant that generates recipes and shopping lists for ingredients If the provided dish name is not a valid dish, recipe name, dessert, drink, etc... respond with { dishName: 'unknown' }";
    const userPrompt = `Generate a recipe and shopping list for the following dish: ${dishName}`;
    const base64Image = image ? Buffer.from(image).toString("base64") : undefined;
    const imageUri = base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined;
    const imageMessages: CoreMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "image",
            image: imageUri ?? "",
          },
        ],
      },
    ];
    const messages: CoreMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: userPrompt },
    ];

    try {
      const groq = createGroq({
        apiKey: env.GROQ_API_KEY,
      });

      if (image) {
        const response = await generateObject({
          model: groq("llama-3.2-90b-vision-preview"),
          schema: RecipeResponseSchema,
          messages: imageMessages,
        });
        recipeResponse = response.object;
      } else {
        const response = await generateObject({
          model: groq("llama-3.3-70b-versatile"),
          schema: RecipeResponseSchema,
          messages,
        });
        recipeResponse = response.object;
      }
    } catch (error) {
      console.error("Groq API error:", error);
    }

    if (!recipeResponse) {
      // If Groq fails, try CloudFlare AI Worker
      provider = "workers";
      console.log("Groq failed, attempting Workers AI...", { recipeId });
      try {
        const workersAi = createWorkersAI({ binding: env.AI });
        if (image) {
          const response = await generateObject({
            model: workersAi(
              "@cf/meta/llama-3.2-11b-vision-instruct" as unknown as BaseAiTextGenerationModels,
            ),
            schema: RecipeResponseSchema,
            messages: imageMessages,
          });
          recipeResponse = response.object;
        } else {
          const response = await generateObject({
            model: workersAi("@cf/meta/llama-3.1-8b-instruct"),
            schema: RecipeResponseSchema,
            messages,
          });
          recipeResponse = response.object;
        }
      } catch (error) {
        console.error("CloudFlare AI Worker error:", error);
      }
    }

    if (!recipeResponse) {
      throw new Error("Both AI providers failed to generate a response");
    }

    if (containsUnknown(recipeResponse)) {
      // Check if the dish name is unknown
      throw new Error(`Unknown dish ${image ? "for image" : `for ${dishName}`}`);
    }

    // Validate the response
    const validatedResponse = RecipeResponseSchema.safeParse(recipeResponse);
    if (!validatedResponse.success) {
      console.error("Recipe validation failed:", {
        recipeId,
        provider,
        errors: validatedResponse.error.errors,
      });
      throw new Error(`Failed to validate recipe ${image ? "from image" : `for ${dishName}`}`);
    }

    // Check if the recipe name already exists
    const existingRecipe = await db
      .select()
      .from(EnglishRecipesTable)
      .where(
        and(
          eq(EnglishRecipesTable.name, validatedResponse.data.dishName.toLowerCase()),
          ne(EnglishRecipesTable.status, "moved"),
          ne(EnglishRecipesTable.id, recipeId), // Don't match the current recipe
        ),
      )
      .get();

    if (existingRecipe && existingRecipe.status === "completed") {
      // Set the status to "moved" and link to the existing recipe
      await db
        .update(EnglishRecipesTable)
        .set({
          status: "moved",
          movedToRecipeId: existingRecipe.id,
          movedToSlug: existingRecipe.slug,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId));

      console.log("Recipe redirected to existing entry:", {
        recipeId,
        existingRecipeId: existingRecipe.id,
        dishName: validatedResponse.data.dishName,
      });
    } else {
      // Update the recipe with the generated content
      try {
        await db
          .update(EnglishRecipesTable)
          .set({
            name: validatedResponse.data.dishName.toLowerCase(),
            data: validatedResponse.data,
            status: "completed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(EnglishRecipesTable.id, recipeId));

        // Save recipe name separately
        await db
          .insert(EnglishRecipeNameTable)
          .values({
            name: validatedResponse.data.dishName.toLowerCase(),
          })
          .onConflictDoNothing();

        const duration = Date.now() - startTime;
        console.log("Recipe generation completed successfully:", {
          recipeId,
          provider,
          duration,
          dishName: validatedResponse.data.dishName,
          cuisine: validatedResponse.data.cuisine,
        });
      } catch (error: unknown) {
        // If we hit a unique constraint error, handle it by moving to the existing recipe
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string" &&
          error.message.includes("UNIQUE constraint failed")
        ) {
          const existingRecipeWithName = await db
            .select()
            .from(EnglishRecipesTable)
            .where(
              and(
                eq(EnglishRecipesTable.name, validatedResponse.data.dishName.toLowerCase()),
                ne(EnglishRecipesTable.status, "moved"),
              ),
            )
            .get();

          if (existingRecipeWithName) {
            await db
              .update(EnglishRecipesTable)
              .set({
                status: "moved",
                movedToRecipeId: existingRecipeWithName.id,
                movedToSlug: existingRecipeWithName.slug,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(EnglishRecipesTable.id, recipeId));

            console.log("Recipe redirected to existing entry after constraint error:", {
              recipeId,
              existingRecipeId: existingRecipeWithName.id,
              dishName: validatedResponse.data.dishName,
            });
            return;
          }
        }
        throw error; // Re-throw if it's not a constraint error or we couldn't find the existing recipe
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Background generation failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      recipeId,
      provider,
      duration,
      dishName: dishName || "image",
    });

    // Update recipe with error status
    await db
      .update(EnglishRecipesTable)
      .set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "An unexpected error occurred",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(EnglishRecipesTable.id, recipeId));
  } finally {
    // Always clean up KV state
    await env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId);
  }
}

function containsUnknown(obj: RecipeResponse): boolean {
  if (obj?.dishName?.includes("unknown")) {
    return true;
  }
  return false;
}
