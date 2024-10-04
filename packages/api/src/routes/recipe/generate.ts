import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { SearchSchema } from "../../../schemas/search";
import { type RecipeResponse, RecipeResponseSchema } from "../../../schemas/recipe-response";
import { publicProcedure } from "../../trpc";
import { EnglishRecipeNameTable } from "../../db/schema";
import Groq from "groq-sdk";
import { TRPCError } from "@trpc/server";
// biome-ignore lint/style/useNodejsImportProtocol: this package functions in Workers, but has to be installed
import { Buffer } from "buffer";

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
  user?: string,
  image?: number[],
): Promise<string | null | undefined> {
  try {
    let completion: Groq.Chat.ChatCompletion;
    if (image) {
      // Convert Uint8Array to base64
      const base64Image = Buffer.from(image).toString("base64");
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      });
      completion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        stream: false,
        response_format: { type: "json_object" },
        messages,
      });
    } else {
      completion = await groq.chat.completions.create(
        {
          model: "llama-3.1-70b-versatile",
          messages,
          response_format: { type: "json_object" },
          stream: false,
          user,
        },
        {
          maxRetries: 3,
        },
      );
    }
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
    } else {
      console.error(error);
    }
    return null;
  }
}

async function completionWithWorkers(
  ai: Ai,
  messages: RoleScopedChatInput[],
  gatewayId: string,
  image?: number[],
): Promise<string | null | undefined> {
  try {
    if (image) {
      const completion = (await ai.run(
        "@cf/meta/llama-3.2-11b-vision-instruct" as BaseAiImageToTextModels,
        {
          messages,
          image,
        },
        {
          gateway: {
            id: gatewayId,
          },
        },
      )) as AiTextGenerationResponse;
      console.log(completion.response);
      return completion.response;
    }
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
      },
    )) as AiTextGenerationResponse;
    return completion.response;
  } catch (error) {
    console.error("CloudFlare AI Worker error:", error);
    return null;
  }
}

export const generate = publicProcedure
  .input(SearchSchema)
  .mutation(async ({ ctx, input: { dishName, image } }) => {
    let response: string | null | undefined;
    const messages: RoleScopedChatInput[] = [];
    if (image) {
      messages.push(
        {
          role: "user",
          content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "", shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}. If you are not aware of the dish, respond with { dishName: "unknown" }`,
        },
        {
          role: "user",
          content: `Identify the recipe name from the image provided. This image might not be of food, in which case respond with { dishName: "unknown" }`,
        },
      );
    } else {
      messages.push(
        {
          role: "system",
          content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "", shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}. If you are not aware of the dish, respond with { dishName: "unknown" }`,
        },
        {
          role: "user",
          content: `Generate a recipe and shopping list for: ${dishName}`,
        },
      );
    }

    // Attempt to get a response from Groq
    response = await completionWithGroq(
      ctx.groq,
      messages as ChatCompletionMessageParam[],
      ctx.user?.id,
      image,
    );
    if (!response) {
      // If Groq fails, try CloudFlare AI Worker
      console.log("Groq completion failed, trying CloudFlare AI Worker");
      response = await completionWithWorkers(
        ctx.ai.client,
        messages as RoleScopedChatInput[],
        ctx.ai.gatewayId,
        image,
      );
    }

    if (!response) {
      // If both fail, throw an error
      console.error("Both Groq and CloudFlare AI Worker completions failed.", {
        response,
        request: { messages, image },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Our AI agents are currently under maintenance. Please try again later.",
      });
    }

    try {
      // Extract the JSON from the response
      const jsonRegex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/;
      const jsonMatch = response.match(jsonRegex);
      console.log("Extracted JSON match:", jsonMatch);

      if (!jsonMatch) {
        console.error("No valid JSON found in the AI response", { response, request: messages });
        throw new Error("An unexpected error occurred. Please try again.");
      }

      let jsonResponse = jsonMatch[0];
      console.log("Extracted JSON string:", jsonResponse);

      // Attempt to parse the JSON
      let parsedResponse: RecipeResponse;
      try {
        parsedResponse = JSON.parse(jsonResponse);
      } catch (parseError) {
        // If parsing fails, attempt to fix the JSON
        console.log("Initial JSON parse failed, attempting to fix JSON");
        jsonResponse = jsonResponse.replace(/(\w+):/g, '"$1":');
        console.log("Fixed JSON string:", jsonResponse);
        parsedResponse = JSON.parse(jsonResponse);
      }

      if (parsedResponse.dishName?.toLowerCase().includes("unknown")) {
        console.error("Unknown dish", { response, request: messages });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown dish ${image ? "" : `: ${dishName}`}`,
        });
      }

      // Validate the response
      const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse);
      if (!validatedResponse.success) {
        console.error("Failed to validate recipe response", {
          response,
          request: messages,
          validationError: validatedResponse.error,
        });
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
