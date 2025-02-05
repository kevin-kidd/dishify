import RecipeCard from "app/features/dish/recipe-card";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverClient } from "utils/trpc";

export default async function RecipePage({ params }: { params: { recipeId: string } }) {
  const { recipeId } = params;
  if (!recipeId) return notFound();

  try {
    // Attempt to fetch recipe and reactions data server-side
    await Promise.all([
      serverClient.recipe.getRecipe.query({ id: recipeId }),
      serverClient.recipe.reactions.getReactions.query({ recipeId }),
    ]);
  } catch (error) {
    console.error("Failed to fetch recipe data:", error);
    // Let the client component handle loading and error states
  }
  return <RecipeCard />;
}

export async function generateMetadata({
  params,
}: { params: { recipeId: string } }): Promise<Metadata> {
  // read route params
  const id = (await params).recipeId;

  // fetch data
  const recipe = await serverClient.recipe.getRecipe.query({ id });

  if (!recipe)
    return {
      title: "Dishify - Recipe not found",
      description: "The recipe you are looking for does not exist",
    };

  return {
    title: {
      template: "%s - Dishify",
      absolute: `${recipe.data?.dishName} - Dishify`,
      default: "Dishify",
    },
    description: `Learn how to make ${recipe.data?.dishName} with ${recipe.data?.servings} servings and ${recipe.data?.cookingTime} minutes of cooking time.`,
  };
}
