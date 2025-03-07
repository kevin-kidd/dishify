import { z } from "zod";

export const RecipeCategorySchema = z.enum([
  "Low Carb",
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Dairy Free",
  "Quick & Easy",
  "One Pot",
  "Budget Friendly",
  "High Protein",
  "Keto",
  "Paleo",
  "Mediterranean",
  "Kid Friendly",
  "Healthy",
  "Comfort Food",
  "Other",
]);

export type RecipeCategory = z.infer<typeof RecipeCategorySchema>;

export const categories = [
  { id: "low-carb", name: "Low Carb", description: "Low carbohydrate recipes" },
  { id: "vegetarian", name: "Vegetarian", description: "Meat-free recipes" },
  { id: "vegan", name: "Vegan", description: "Plant-based recipes" },
  { id: "gluten-free", name: "Gluten Free", description: "No gluten recipes" },
  { id: "dairy-free", name: "Dairy Free", description: "No dairy recipes" },
  { id: "quick-easy", name: "Quick & Easy", description: "30 minutes or less" },
  { id: "one-pot", name: "One Pot", description: "Single pot recipes" },
  { id: "budget", name: "Budget Friendly", description: "Cost-effective recipes" },
  { id: "high-protein", name: "High Protein", description: "Protein-rich recipes" },
  { id: "keto", name: "Keto", description: "Ketogenic diet recipes" },
  { id: "paleo", name: "Paleo", description: "Paleolithic diet recipes" },
  { id: "mediterranean", name: "Mediterranean", description: "Mediterranean diet recipes" },
  { id: "kid-friendly", name: "Kid Friendly", description: "Family-friendly recipes" },
  { id: "healthy", name: "Healthy", description: "Nutritious recipes" },
  { id: "comfort", name: "Comfort Food", description: "Hearty comfort recipes" },
  { id: "other", name: "Other", description: "Other recipe categories" },
] as const;

export type Category = (typeof categories)[number];
