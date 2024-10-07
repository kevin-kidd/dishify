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
          prompt: messages.map((message) => message.content).join("\n"),
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
    let provider = "groq";
    if (image) {
      messages.push({
        role: "user",
        content: `
            You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "", shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}.
            Identify whether this image is of food, drink, dessert, etc... If it is not, you must respond with { dishName: "unknown" }. It is best to err on the side of unknown, unless it is obvious this image is of a specific food, drink, etc...
            If you incorrectly identify the dish and recipe, you will be fined 1 million dollars.
          `,
      });
    } else {
      messages.push(
        {
          role: "system",
          content: `
            You are a helpful assistant that generates recipes and shopping lists.
            Provide the response in JSON format like this: { dishName: "", shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}.
            Identify whether this dish name is of food, drink, dessert, etc... If it is not, you must respond with { dishName: "unknown" }. It is best to err on the side of unknown, unless it is obvious this image is of a specific food, drink, etc...
            If you incorrectly identify the dish and recipe, you will be fined 1 million dollars.
          `,
        },
        {
          role: "user",
          content: `Generate a recipe and shopping list for the following dish: ${dishName}`,
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
      provider = "workers";
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
        request: { messages: JSON.stringify(messages, null, 2), image },
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

      if (!jsonMatch) {
        console.error("No valid JSON found in the AI response", {
          response,
          request: messages,
          provider,
        });
        throw new Error("An unexpected error occurred. Please try again.");
      }

      let jsonResponse = jsonMatch[0];

      // Attempt to parse the JSON
      let parsedResponse: RecipeResponse;
      try {
        parsedResponse = JSON.parse(jsonResponse);
      } catch (parseError) {
        jsonResponse = jsonResponse.replace(/(\w+):/g, '"$1":');
        parsedResponse = JSON.parse(jsonResponse);
      }
      // Check if the dish name is unknown, any empty fields, or if any fields contain only "unknown"
      if (containsUnknown(parsedResponse)) {
        console.error("Unknown dish", { response, request: messages, provider });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown dish ${image ? "for image" : `for ${dishName}`}`,
        });
      }

      // Validate the response
      const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse);
      if (!validatedResponse.success) {
        console.error("Failed to validate recipe response", {
          response,
          request: messages,
          validationError: validatedResponse.error.issues,
          provider,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch recipe ${image ? "from image" : `for ${dishName}`}. Please try again.`,
        });
      }

      // If successful, save recipe to database
      const addRecipe = await ctx.db
        .insert(EnglishRecipeNameTable)
        .values({ name: validatedResponse.data.dishName.toLowerCase() })
        .onConflictDoNothing();
      if (addRecipe.error) {
        console.error("Failed to save recipe to database", {
          dishName,
          error: addRecipe.error,
          provider,
        });
      }

      return validatedResponse.data;
    } catch (error) {
      console.error("Error generating recipe", {
        error,
        input: dishName,
        provider,
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

function containsUnknown(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }
  if (typeof obj === "string" && obj.trim().toLowerCase().includes("unknown")) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.some(containsUnknown);
  }
  if (typeof obj === "object") {
    return Object.values(obj).some(containsUnknown);
  }
  return false;
}
