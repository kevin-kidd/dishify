import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { SearchSchema } from "../../../schemas/search";
import { RecipeResponse, RecipeResponseSchema } from "../../../schemas/recipe-response";
import { publicProcedure } from "../../trpc";
import { EnglishRecipeNameTable } from "../../db/schema";
import Groq from "groq-sdk";
import { TRPCError } from "@trpc/server";

type AiTextGenerationResponse = {
  response?: string;
  tool_calls?: {
    name: string;
    arguments: unknown;
  }[];
};

async function completionWithGroq(
  groq: Groq,
  messages: ChatCompletionMessageParam[],
  user?: string
): Promise<string | null | undefined> {
  try {
    const completion = await groq.chat.completions.create(
      {
        model: "llama-3.1-70b-versatile",
        messages,
        stream: false,
        user,
      },
      {
        maxRetries: 3,
      }
    );
    return completion.choices?.[0]?.message.content;
  } catch (error) {
    if (error instanceof Groq.APIError) {
      switch (error.status) {
        case 429:
          console.error("Groq: Rate limit exceeded");
          break;
        case 500:
          console.error("Groq: Internal server error.");
          break;
        case 503:
          console.error("Groq: Service unavailable.");
          break;
        default:
          console.error("Groq API error:", error);
      }
    }
    return null;
  }
}

async function completionWithWorkers(
  ai: Ai,
  messages: RoleScopedChatInput[],
  gatewayId: string
): Promise<string | null | undefined> {
  try {
    const completion = (await ai.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages,
        stream: false,
      },
      {
        gateway: {
          id: gatewayId,
        },
      }
    )) as AiTextGenerationResponse;
    return completion.response;
  } catch (error) {
    console.error("CloudFlare AI Worker error:", error);
    return null;
  }
}

async function imageCompletionWithWorkers(
  ai: Ai,
  messages: RoleScopedChatInput[],
  gatewayId: string,
  image: number[]
): Promise<string | null | undefined> {
  try {
    const completion = await ai.run(
      "@cf/unum/uform-gen2-qwen-500m",
      {
        messages,
        image,
      },
      {
        gateway: {
          id: gatewayId,
        },
      }
    );
    return completion.description;
  } catch (error) {
    console.error("CloudFlare AI Worker error:", error);
    return null;
  }
}

export const generate = publicProcedure
  .input(SearchSchema)
  .mutation(async ({ ctx, input: { dishName, image } }) => {
    let response: string | null | undefined;
    let messages: RoleScopedChatInput[] = [];
    if (image) {
      // Handle image generation
      messages = [
        {
          role: "system",
          content: `You are a helpful assistant that identifies recipe names from images of dishes, drinks, desserts and more. You will only respond with the recipe name, not including anything else. The image might not be of food or drinks, in which case respond with "unknown". You should err on the side of caution by responding with "unknown" if you are not sure of the recipe name.`,
        },
        {
          role: "user",
          content: `Identify the recipe name from the image provided. This image might not be of food, in which case respond with "unknown".`,
        },
      ];
      response = await imageCompletionWithWorkers(ctx.ai.client, messages, ctx.ai.gatewayId, image);
      if (!response) {
        console.error("Failed to generate image response", { image, request: messages });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate image. Please try again.",
        });
      }
      if (response.includes("unknown") || response.toLowerCase().startsWith("No")) {
        console.error("Unknown dish", { response, request: messages });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown dish",
        });
      }
      dishName = response;
    }
    messages = [
      {
        role: "system",
        content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "", shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}. If you are not aware of the dish, respond with { dishName: "unknown" }`,
      },
      {
        role: "user",
        content: `Generate a recipe and shopping list for: ${dishName}`,
      },
    ];
    // Attempt to get a response from Groq
    response = await completionWithGroq(
      ctx.groq,
      messages as ChatCompletionMessageParam[],
      ctx.user?.id
    );
    if (!response) {
      // If Groq fails, try CloudFlare AI Worker
      console.log("Groq completion failed, trying CloudFlare AI Worker");
      response = await completionWithWorkers(
        ctx.ai.client,
        messages as RoleScopedChatInput[],
        ctx.ai.gatewayId
      );
    }

    if (!response) {
      // If both fail, throw an error
      console.error("Both Groq and CloudFlare AI Worker completions failed.", {
        response,
        request: messages,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Our AI agents are currently under maintenance. Please try again later.",
      });
    }

    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/{[\s\S]*}/);
      const jsonResponse = jsonMatch ? jsonMatch[0] : null;
      if (!jsonResponse) {
        console.error("No valid JSON found in the AI response", { response, request: messages });
        throw new Error("An unexpected error occurred. Please try again.");
      }
      // Parse the response
      const parsedResponse = JSON.parse(jsonResponse);
      if (parsedResponse.dishName?.includes("unknown")) {
        console.error("Unknown dish", { response, request: messages });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown dish: ${dishName}`,
        });
      }
      // Validate the response
      const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse);
      if (!validatedResponse.success) {
        console.error("Failed to validate recipe response", { response, request: messages });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch recipe: ${dishName}. Please try again.`,
        });
      }

      // If successful, save recipe to database
      const addRecipe = await ctx.db
        .insert(EnglishRecipeNameTable)
        .values({ name: validatedResponse.data.dishName.toLowerCase() })
        .onConflictDoNothing();
      if (addRecipe.error) {
        console.error("Failed to save recipe to database", { dishName, error: addRecipe.error });
      }

      return validatedResponse.data;
    } catch (error) {
      console.error("Error generating recipe", {
        error,
        input: dishName,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof TRPCError
            ? error.message
            : "Failed to generate recipe. Please try again.",
      });
    }
  });
