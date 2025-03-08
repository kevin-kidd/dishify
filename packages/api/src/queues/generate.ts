import type { DrizzleD1Database } from "drizzle-orm/d1";
import { EnglishRecipeNameTable, EnglishRecipesTable } from "../db/schema/recipes";
import { eq, and, ne } from "drizzle-orm";
import { type RecipeResponse, RecipeResponseSchema } from "../../schemas/recipe-response";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateObject, generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import type * as recipeSchema from "../db/schema/recipes";
import type * as userSchema from "../db/schema/user";
import type { Bindings, RecipeQueueMessage } from "../types";
import { tryCatch } from "@dishify/app/utils/helpers";
import { categories } from "../../schemas/category";

const RECIPE_STATE_PREFIX = "recipe_state:";
const IMAGE_DATA_PREFIX = "image_data:";

export async function generateRecipe(
  { recipeId, dishName, hasImage }: RecipeQueueMessage,
  db: DrizzleD1Database<typeof recipeSchema & typeof userSchema>,
  env: Bindings,
) {
  let provider = "groq";
  const startTime = Date.now();

  console.log("Starting recipe generation:", {
    recipeId,
    dishName,
    hasImage,
    provider,
  });

  let image: number[] | undefined;
  let base64Image: string | undefined;

  if (hasImage) {
    const { data: imageData, error: imageError } = await tryCatch(
      env.RECIPE_STATE.get(IMAGE_DATA_PREFIX + recipeId),
    );

    if (imageData && !imageError) {
      const imageDataObject = JSON.parse(imageData);
      base64Image = Buffer.from(imageDataObject).toString("base64");
      image = imageDataObject;
    }
  }

  const imageUri = base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined;

  let recipeResponse: RecipeResponse | null | string = null;
  const exampleResponse: RecipeResponse = {
    dishName: "Example",
    shoppingList: [
      {
        item: "Example 1",
        quantity: "2 ounces",
      },
      {
        item: "Example 2",
        quantity: "1 cup",
      },
    ],
    cuisine: "American",
    category: "Other",
    difficulty: "Easy",
    instructions: ["Step 1", "Step 2", "Step 3"],
    servings: "1",
    cookingTime: "10 minutes",
  };

  const systemPrompt = `You are a helpful assistant that generates recipes and shopping lists for ingredients. 
  If the provided dish name is not a valid dish, recipe name, dessert, drink, etc... respond with { dishName: 'unknown' }. 
  If there is a spelling mistake in the dish name, but it is clear what the dish is, respond with the correct dish name. 
  If you incorrectly identify the dish and recipe, you will be fined 1 million dollars.
  
  You must also categorize the recipe into one of these categories: ${categories.map((c: { name: string }) => c.name).join(", ")}.
  Choose the most appropriate category or use "Other" if none fit well.`;

  const userPrompt = `Generate a recipe and shopping list for the following dish: ${dishName}`;
  const imagePrompt = `You are a helpful assistant that generates recipes and shopping lists.
          Provide the response in JSON format like this: ${JSON.stringify(exampleResponse)}.
          Identify whether this dish name is of food, drink, dessert, etc... If it is not, you must respond with { dishName: "unknown" }. It is best to err on the side of unknown, unless it is obvious this image is of a specific food, drink, etc...
          If there is a spelling mistake in the dish name, but it is clear what the dish is, respond with the correct dish name.
          If you incorrectly identify the dish and recipe, you will be fined 1 million dollars.`;

  const imageMessages: CoreMessage[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: imagePrompt,
        },
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

  // Try Groq first
  const groq = createGroq({
    apiKey: env.GROQ_API_KEY,
  });

  if (hasImage && imageUri) {
    const { data: groqResponse, error: groqError } = await tryCatch(
      generateText({
        model: groq("llama-3.2-90b-vision-preview"),
        messages: imageMessages,
      }),
    );

    if (groqResponse && !groqError) {
      recipeResponse = groqResponse.text;
    } else if (groqError) {
      const errorMessage = groqError.message || "Unknown error";
      console.error("Groq API error:", {
        error: errorMessage,
        recipeId,
        dishName,
        hasImage,
      });

      // Store the error for later analysis
      await tryCatch(
        env.RECIPE_STATE.put(
          `${RECIPE_STATE_PREFIX}error:groq:${recipeId}`,
          JSON.stringify({ error: errorMessage, timestamp: new Date().toISOString() }),
        ),
      );
    }
  } else {
    const { data: groqResponse, error: groqError } = await tryCatch(
      generateObject({
        model: groq("llama-3.3-70b-versatile"),
        schema: RecipeResponseSchema,
        messages,
      }),
    );

    if (groqResponse && !groqError) {
      recipeResponse = groqResponse.object;
    } else if (groqError) {
      const errorMessage = groqError.message || "Unknown error";
      console.error("Groq API error:", {
        error: errorMessage,
        recipeId,
        dishName,
        hasImage,
      });

      // Store the error for later analysis
      await tryCatch(
        env.RECIPE_STATE.put(
          `${RECIPE_STATE_PREFIX}error:groq:${recipeId}`,
          JSON.stringify({ error: errorMessage, timestamp: new Date().toISOString() }),
        ),
      );
    }
  }

  // If Groq fails, try CloudFlare AI Worker
  if (!recipeResponse) {
    provider = "workers";
    console.log("Groq failed, attempting Workers AI...", { recipeId });

    const workersAi = createWorkersAI({ binding: env.AI });

    if (hasImage && imageUri) {
      const { data: workersResponse, error: workersError } = await tryCatch(
        env.AI.run(
          "@cf/meta/llama-3.2-11b-vision-instruct" as any,
          {
            prompt: messages
              .map((message) => (typeof message.content === "string" ? message.content : ""))
              .join("\n"),
            image,
          },
          {
            gateway: {
              id: env.AI_GATEWAY_ID,
            },
          },
        ),
      );

      if (workersResponse && !workersError) {
        recipeResponse = (workersResponse as any).text;
      } else if (workersError) {
        const errorMessage = workersError.message || "Unknown error";
        console.error("CloudFlare AI Worker error:", {
          error: errorMessage,
          recipeId,
          dishName,
          hasImage,
        });

        // Store the error for later analysis
        await tryCatch(
          env.RECIPE_STATE.put(
            `${RECIPE_STATE_PREFIX}error:workers:${recipeId}`,
            JSON.stringify({ error: errorMessage, timestamp: new Date().toISOString() }),
          ),
        );
      }
    } else {
      const { data: workersResponse, error: workersError } = await tryCatch(
        generateObject({
          model: workersAi("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
          schema: RecipeResponseSchema,
          messages,
        }),
      );

      if (workersResponse && !workersError) {
        recipeResponse = workersResponse.object;
      } else if (workersError) {
        const errorMessage = workersError.message || "Unknown error";
        console.error("CloudFlare AI Worker error:", {
          error: errorMessage,
          recipeId,
          dishName,
          hasImage,
        });

        // Store the error for later analysis
        await tryCatch(
          env.RECIPE_STATE.put(
            `${RECIPE_STATE_PREFIX}error:workers:${recipeId}`,
            JSON.stringify({ error: errorMessage, timestamp: new Date().toISOString() }),
          ),
        );
      }
    }
  }

  // If both providers failed, update recipe with error status and return
  if (!recipeResponse) {
    const errorMessage = `Both AI providers failed to generate a response. Check ${RECIPE_STATE_PREFIX}error:* for details.`;
    console.error("Background generation failed:", {
      error: errorMessage,
      recipeId,
      provider,
      duration: Date.now() - startTime,
      dishName: dishName || "image",
    });

    await tryCatch(
      db
        .update(EnglishRecipesTable)
        .set({
          status: "error",
          errorMessage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    // Clean up KV state
    const { error: cleanupError } = await tryCatch(
      env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
    );
    if (cleanupError) {
      console.error("Failed to clean up KV state:", {
        error: cleanupError.message,
        recipeId,
      });
    }
    return;
  }

  let parsedResponse: unknown = recipeResponse;

  if (hasImage) {
    let jsonResponse: string | undefined = JSON.stringify(recipeResponse);

    if (typeof recipeResponse === "string") {
      // Extract the JSON from the response
      const jsonRegex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/;
      const jsonMatch = recipeResponse.match(jsonRegex);

      if (!jsonMatch) {
        const errorMessage = "No valid JSON found in the AI response";
        console.error("Background generation failed:", {
          error: errorMessage,
          recipeId,
          provider,
          duration: Date.now() - startTime,
          dishName: dishName || "image",
        });

        await tryCatch(
          db
            .update(EnglishRecipesTable)
            .set({
              status: "error",
              errorMessage,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(EnglishRecipesTable.id, recipeId)),
        );

        // Clean up KV state
        const { error: cleanupError } = await tryCatch(
          env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
        );
        if (cleanupError) {
          console.error("Failed to clean up KV state:", {
            error: cleanupError.message,
            recipeId,
          });
        }
        return;
      }

      jsonResponse = jsonMatch[0];
    }

    // Attempt to parse the JSON
    const { data: parsedData, error: parseError } = await tryCatch(
      Promise.resolve(JSON.parse(jsonResponse)),
    );

    if (parsedData && !parseError) {
      parsedResponse = parsedData;
    } else {
      // Try fixing common JSON formatting issues
      jsonResponse = jsonResponse.replace(/(\w+):/g, '"$1":');
      const { data: fixedParsedData, error: fixedParseError } = await tryCatch(
        Promise.resolve(JSON.parse(jsonResponse)),
      );

      if (fixedParsedData && !fixedParseError) {
        parsedResponse = fixedParsedData;
      } else {
        const errorMessage = "Failed to parse JSON from AI response";
        console.error("Background generation failed:", {
          error: errorMessage,
          recipeId,
          provider,
          duration: Date.now() - startTime,
          dishName: dishName || "image",
        });

        await tryCatch(
          db
            .update(EnglishRecipesTable)
            .set({
              status: "error",
              errorMessage,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(EnglishRecipesTable.id, recipeId)),
        );

        // Clean up KV state
        const { error: cleanupError } = await tryCatch(
          env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
        );
        if (cleanupError) {
          console.error("Failed to clean up KV state:", {
            error: cleanupError.message,
            recipeId,
          });
        }
        return;
      }
    }
  }

  if (containsUnknown(parsedResponse)) {
    // Check if the dish name is unknown
    const errorMessage = `Unknown dish ${image ? "for image" : `for ${dishName}`}`;
    console.error("Background generation failed:", {
      error: errorMessage,
      recipeId,
      provider,
      duration: Date.now() - startTime,
      dishName: dishName || "image",
    });

    await tryCatch(
      db
        .update(EnglishRecipesTable)
        .set({
          status: "error",
          errorMessage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    // Clean up KV state
    const { error: cleanupError } = await tryCatch(
      env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
    );
    if (cleanupError) {
      console.error("Failed to clean up KV state:", {
        error: cleanupError.message,
        recipeId,
      });
    }
    return;
  }

  // Validate the response
  const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse);
  if (!validatedResponse.success) {
    const errorMessage = `Failed to validate recipe ${hasImage ? "from image" : `for ${dishName}`}`;
    console.error("Recipe validation failed:", {
      recipeId,
      provider,
      errors: validatedResponse.error.errors,
    });
    console.error(parsedResponse);

    await tryCatch(
      db
        .update(EnglishRecipesTable)
        .set({
          status: "error",
          errorMessage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    // Clean up KV state
    const { error: cleanupError } = await tryCatch(
      env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
    );
    if (cleanupError) {
      console.error("Failed to clean up KV state:", {
        error: cleanupError.message,
        recipeId,
      });
    }
    return;
  }

  // Check if the recipe name already exists
  const { data: existingRecipe, error: existingRecipeError } = await tryCatch(
    db
      .select()
      .from(EnglishRecipesTable)
      .where(
        and(
          eq(EnglishRecipesTable.name, validatedResponse.data.dishName.toLowerCase()),
          ne(EnglishRecipesTable.status, "moved"),
          ne(EnglishRecipesTable.id, recipeId), // Don't match the current recipe
        ),
      )
      .get(),
  );

  if (existingRecipe && !existingRecipeError && existingRecipe.status === "completed") {
    // Set the status to "moved" and link to the existing recipe
    const { error: updateError } = await tryCatch(
      db
        .update(EnglishRecipesTable)
        .set({
          status: "moved",
          movedToRecipeId: existingRecipe.id,
          movedToSlug: existingRecipe.slug,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    if (!updateError) {
      console.log("Recipe redirected to existing entry:", {
        recipeId,
        existingRecipeId: existingRecipe.id,
        dishName: validatedResponse.data.dishName,
      });
    } else {
      console.error("Failed to update recipe status to moved:", {
        error: updateError.message,
        recipeId,
        existingRecipeId: existingRecipe.id,
      });
    }
  } else {
    // Generate description
    const description = await generateRecipeDescription(
      validatedResponse.data.dishName,
      validatedResponse.data.cuisine,
      validatedResponse.data.shoppingList,
      env,
    );

    // Generate image
    const imageUrl = await generateRecipeImage(
      validatedResponse.data.dishName,
      validatedResponse.data.cuisine,
      env,
    );

    // Update the recipe with the generated content
    const { error: updateError } = await tryCatch(
      db
        .update(EnglishRecipesTable)
        .set({
          name: validatedResponse.data.dishName.toLowerCase(),
          data: validatedResponse.data,
          status: "completed",
          description,
          imageUrl,
          category: validatedResponse.data.category,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    if (updateError) {
      // Check if it's a unique constraint error
      if (updateError?.message?.includes("UNIQUE constraint failed")) {
        const { data: existingRecipeWithName, error: nameError } = await tryCatch(
          db
            .select()
            .from(EnglishRecipesTable)
            .where(
              and(
                eq(EnglishRecipesTable.name, validatedResponse.data.dishName.toLowerCase()),
                ne(EnglishRecipesTable.status, "moved"),
              ),
            )
            .get(),
        );

        if (existingRecipeWithName && !nameError) {
          const { error: moveError } = await tryCatch(
            db
              .update(EnglishRecipesTable)
              .set({
                status: "moved",
                movedToRecipeId: existingRecipeWithName.id,
                movedToSlug: existingRecipeWithName.slug,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(EnglishRecipesTable.id, recipeId)),
          );

          if (!moveError) {
            console.log("Recipe redirected to existing entry after constraint error:", {
              recipeId,
              existingRecipeId: existingRecipeWithName.id,
              dishName: validatedResponse.data.dishName,
            });
          } else {
            console.error("Failed to update recipe status to moved after constraint error:", {
              error: moveError.message,
              recipeId,
            });
          }
        } else {
          console.error("Failed to find existing recipe with name after constraint error:", {
            error: nameError?.message || "Unknown error",
            recipeId,
            dishName: validatedResponse.data.dishName,
          });
        }
      } else {
        console.error("Failed to update recipe:", {
          error: updateError.message,
          recipeId,
        });
      }
    } else {
      // Save recipe name separately
      const { error: insertError } = await tryCatch(
        db
          .insert(EnglishRecipeNameTable)
          .values({
            name: validatedResponse.data.dishName.toLowerCase(),
          })
          .onConflictDoNothing(),
      );

      if (insertError) {
        console.error("Failed to insert recipe name:", {
          error: insertError.message,
          recipeId,
          dishName: validatedResponse.data.dishName,
        });
      }

      const duration = Date.now() - startTime;
      console.log("Recipe generation completed successfully:", {
        recipeId,
        provider,
        duration,
        dishName: validatedResponse.data.dishName,
        cuisine: validatedResponse.data.cuisine,
        category: validatedResponse.data.category,
      });
    }
  }

  // Clean up KV state
  const { error: cleanupError } = await tryCatch(
    env.RECIPE_STATE.delete(RECIPE_STATE_PREFIX + recipeId),
  );
  if (cleanupError) {
    console.error("Failed to clean up KV state:", {
      error: cleanupError.message,
      recipeId,
    });
  }
}

function containsUnknown(obj: unknown): boolean {
  if (
    typeof obj === "object" &&
    obj !== null &&
    "dishName" in obj &&
    typeof obj.dishName === "string"
  ) {
    return obj.dishName.includes("unknown");
  }
  return false;
}

/**
 * Generates an engaging description for the recipe using AI
 */
export async function generateRecipeDescription(
  dishName: string,
  cuisine: RecipeResponse["cuisine"],
  ingredients: Array<{ item: string; quantity: string }>,
  env: Bindings,
): Promise<string> {
  const ingredientsList = ingredients.map((ing) => ing.item).join(", ");

  const prompt = `Write an engaging and appetizing description for ${dishName}, a ${cuisine} dish. 
    The dish contains these key ingredients: ${ingredientsList}.
    The description should be enticing and make the reader want to try the recipe. 
    Mention 1-2 of the most distinctive ingredients that make this dish special.
    Keep it to a maximum of 2 sentences and focus on what makes this dish special.
    Do not exceed 200 characters in length.
    Only respond with the description, nothing else.`;
  try {
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
    const workersAi = createWorkersAI({ binding: env.AI });

    const { data: workersResponse, error: workersError } = await tryCatch(
      generateText({
        model: workersAi("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
        prompt,
      }),
    );

    if (workersResponse && !workersError) {
      return workersResponse.text.trim();
    }

    return `A delightful ${cuisine} dish that will tantalize your taste buds. ${dishName} is perfect for any occasion and sure to impress.`;
  } catch (error) {
    console.error(
      "Failed to generate recipe description for both Groq and Cloudflare Workers AI",
      error,
    );
    return `A delightful ${cuisine} dish that will tantalize your taste buds. ${dishName} is perfect for any occasion and sure to impress.`;
  }
}

/**
 * Generates an image for the recipe using Cloudflare Workers AI
 */
export async function generateRecipeImage(
  dishName: string,
  cuisine: RecipeResponse["cuisine"],
  env: Bindings,
): Promise<string> {
  try {
    const prompt = `High resolution photo of ${dishName}, a ${cuisine} dish, presented nicely, as if it was made in a michelin star restaurant. Food photography with professional lighting, on elegant dinnerware.`;

    const imageResponse = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt });

    if (!imageResponse || !imageResponse.image) {
      throw new Error("Failed to generate image: Empty response");
    }

    try {
      const imageData = Buffer.from(imageResponse.image, "base64");
      const formData = new FormData();
      const fileName = `${dishName.replace(/\s+/g, "-").toLowerCase()}.jpg`;

      formData.append("file", new File([imageData], fileName, { type: "image/jpeg" }));
      formData.append(
        "metadata",
        JSON.stringify({
          dishName,
          cuisine,
          generatedAt: new Date().toISOString(),
        }),
      );

      const uploadResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/images/v1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.CF_IMAGES_API_TOKEN}`,
          },
          body: formData,
        },
      );

      const uploadResult = (await uploadResponse.json()) as {
        success: boolean;
        errors: Array<{ code: number; message: string }>;
        result: { id: string; variants: string[] };
      };

      if (!uploadResult.success) {
        throw new Error(
          `Failed to upload image: ${uploadResult.errors.map((e) => e.message).join(", ")}`,
        );
      }

      const imageId = uploadResult.result.id;
      const imageUrl = `https://imagedelivery.net/${env.CF_IMAGES_ACCOUNT_HASH}/${imageId}/public`;

      return imageUrl;
    } catch (uploadError) {
      console.error("Failed to upload image to Cloudflare Images:", uploadError);
      return `data:image/jpeg;base64,${imageResponse.image}`;
    }
  } catch (error) {
    console.error("Failed to generate recipe image", error);
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(dishName)}`;
  }
}
