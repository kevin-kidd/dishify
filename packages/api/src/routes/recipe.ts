import { publicProcedure, router } from "../trpc";
import { z } from "zod";

export const recipeRouter = router({
  generate: publicProcedure
    .input(z.object({ dishName: z.string().min(3, "Dish name is too short.") }))
    .query(async ({ ctx, input: { dishName } }) => {
      const completion = await ctx.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }} `,
          },
          {
            role: "user",
            content: `Generate a recipe and shopping list for: ${dishName}`,
          },
        ],
        model: "llama-3.1-70b-versatile",
      });
      const response = completion?.choices?.[0].message?.content;
      if (!response) {
        throw new Error("Failed to get message from Groq API");
      }
      if (response.includes("```json")) {
        response.replace("```json", "");
      }
      if (response.includes("````")) {
        response.replace("```", "");
      }
      return JSON.parse(response);
    }),
});
