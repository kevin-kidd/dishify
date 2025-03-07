import DishScreen from "@dishify/app/features/dish/screen";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverClient } from "utils/trpc";

export default async function RecipePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  if (!slug) return notFound();

  // Check if this is a local storage request (format: local-{recipeId})
  const isLocalStorage = slug.startsWith("local-");

  if (!isLocalStorage) {
    try {
      // Fetch data server-side without hooks
      await Promise.all([
        serverClient.recipe.getRecipeBySlug.query({ slug }),
        serverClient.recipe.reactions.getReactions.query({ slug }),
      ]);
    } catch (error) {
      console.error("Failed to fetch recipe data:", error);
      // Let the client component handle loading and error states
    }
  }
  return <DishScreen />;
}

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  // read route params
  const slug = params.slug;

  // Check if this is a local storage request
  const isLocalStorage = slug.startsWith("local-");
  if (isLocalStorage) {
    // We can't generate metadata for local storage recipes server-side
    return {
      title: "Dishify - Recipe",
      description: "View your saved recipe",
    };
  }

  try {
    // fetch data using the server client without hooks
    const recipe = await serverClient.recipe.getRecipeBySlug.query({ slug });
    if (!recipe) {
      return {
        title: "Dishify - Recipe not found",
        description: "The recipe you are looking for does not exist",
      };
    }
    return {
      title: {
        template: "%s - Dishify",
        absolute: `${recipe.data?.dishName} - Dishify`,
        default: "Dishify",
      },
      description: `Learn how to make ${recipe.data?.dishName} with ${recipe.data?.servings} servings and ${recipe.data?.cookingTime} minutes of cooking time.`,
    };
  } catch (error) {
    console.error("Failed to fetch recipe data:", error);
    return {
      title: "Dishify - Recipe not found",
      description: "The recipe you are looking for does not exist",
    };
  }
}
