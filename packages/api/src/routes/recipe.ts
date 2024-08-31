import { publicProcedure, router } from "../trpc"
import { DishNameSchema } from "../../schemas/dish-name"
import { RecipeResponseSchema } from "../../schemas/recipe-response"
export const recipeRouter = router({
  generate: publicProcedure.input(DishNameSchema).query(async ({ ctx, input: { dishName } }) => {
    const completion = await ctx.groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates recipes and shopping lists. Provide the response in JSON format like this: { dishName: "",shoppingList: [{ item: "", quantity: "" }], recipe: { cookingTime: "", instructions: [""], servings: "" }}. If you are not aware of the dish, respond with { dishName: "unknown"}`,
        },
        {
          role: "user",
          content: `Generate a recipe and shopping list for: ${dishName}`,
        },
      ],
      model: "llama-3.1-70b-versatile",
    })
    const response = completion?.choices?.[0].message?.content
    if (!response) {
      throw new Error("Failed to get message from Groq API")
    }
    // Remove the JSON markdown wrapper
    if (response.includes("```json")) {
      response.replace("```json", "")
    }
    if (response.includes("````")) {
      response.replace("```", "")
    }
    // Parse the response
    const parsedResponse = JSON.parse(response)
    if (parsedResponse.dishName === "unknown") {
      throw new Error(`Unknown dish: ${dishName}`)
    }
    // Validate the response
    const validatedResponse = RecipeResponseSchema.safeParse(parsedResponse)
    if (!validatedResponse.success) {
      console.error(validatedResponse.error)
      throw new Error(`Failed to fetch recipe: ${dishName}`)
    }
    return validatedResponse.data
  }),
})
