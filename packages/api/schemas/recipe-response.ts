import { z } from "zod";

export const RecipeResponseSchema = z.object({
  dishName: z.string(),
  shoppingList: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
    }),
  ),
  recipe: z.object({
    cookingTime: z.string(),
    instructions: z.array(z.string()),
    servings: z.string(),
  }),
});

export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;
