import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { DishNameSchema } from "../../../schemas/dish-name";
import { RecipeResponseSchema } from "../../../schemas/recipe-response";
import { publicProcedure } from "../../trpc";
import { EnglishRecipeNameTable } from "../../db/schema";

export const generate = publicProcedure
  .input(DishNameSchema)
  .query(async ({ ctx, input: { dishName } }) => {
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "",shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}. If you are not aware of the dish, respond with { dishName: "unknown"}`,
      },
      {
        role: "user",
        content: `Generate a recipe and shopping list for: ${dishName}`,
      },
    ];
    const completion = await ctx.groq.chat.completions.create(
      {
        model: "llama-3.1-70b-versatile",
        messages,
        stream: false,
        user: ctx.user?.id,
      },
      {
        maxRetries: 3,
      }
    );
    const response = completion.choices?.[0]?.message.content;
    if (!response) {
      console.error("Failed to get response from AI API", { response, request: messages });
      throw new Error("An unexpected error occurred. Please try again.");
    }
    // Extract the JSON from the response
    const jsonMatch = response.match(/{[\s\S]*}/);
    const jsonResponse = jsonMatch ? jsonMatch[0] : null;
    if (!jsonResponse) {
      console.error("No valid JSON found in the AI response", { response, request: messages });
      throw new Error("An unexpected error occurred. Please try again.");
    }
    // Parse the response
    const parsedResponse = JSON.parse(jsonResponse);
    if (parsedResponse.dishName === "unknown") {
      console.error("Unknown dish", { response, request: messages });
      throw new Error(`Unknown dish: ${dishName}`);
    }
    // Validate the response
    const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse);
    if (!validatedResponse.success) {
      console.error("Failed to validate recipe response", { response, request: messages });
      throw new Error(`Failed to fetch recipe: ${dishName}. Please try again.`);
    }

    // If successful, save recipe to database
    const addRecipe = await ctx.db.insert(EnglishRecipeNameTable).values({ name: dishName });
    if (addRecipe.error) {
      console.error("Failed to save recipe to database", { dishName, error: addRecipe.error });
    }

    return validatedResponse.data;
  });
