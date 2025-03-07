import { z } from "zod";
import { RecipeCategorySchema } from "./category";

export const RecipeResponseSchema = z.object({
  dishName: z.string(),
  shoppingList: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
    }),
  ),
  cuisine: z.enum([
    "British",
    "Mexican",
    "Italian",
    "Japanese",
    "Chinese",
    "Indian",
    "French",
    "Spanish",
    "German",
    "American",
    "Thai",
    "Vietnamese",
    "Brazilian",
    "Moroccan",
    "Turkish",
    "Korean",
    "Russian",
    "Greek",
    "Dutch",
    "Portuguese",
    "Belgian",
    "Swedish",
    "Norwegian",
    "Danish",
    "Finnish",
    "Czech",
    "Polish",
    "Hungarian",
    "Other",
    "Unknown",
  ]),
  category: RecipeCategorySchema,
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  instructions: z.array(z.string()),
  servings: z.string(),
  cookingTime: z.string(),
});

export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;
