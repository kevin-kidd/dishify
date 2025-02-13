import { z } from "zod";

export const RecipeResponseSchema = z.object({
  dishName: z.string().or(z.literal("unknown")),
  shoppingList: z.array(
    z.object({
      item: z.string(),
      quantity: z.string(),
    }),
  ),
  cuisine: z.enum([
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
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  instructions: z.array(z.string()),
  servings: z.string(),
  cookingTime: z.string(),
});

export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;
