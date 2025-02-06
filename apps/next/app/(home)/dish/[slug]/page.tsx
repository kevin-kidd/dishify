import RecipeCard from "app/features/dish/recipe-card";
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
      // Attempt to fetch recipe and reactions data server-side
      await Promise.all([
        serverClient.recipe.getRecipeBySlug.usePrefetchQuery({ slug }),
        serverClient.recipe.reactions.getReactions.usePrefetchQuery({ slug }),
        serverClient.recipe.favorites.isFavorited.usePrefetchQuery({ id: slug }),
      ]);
    } catch (error) {
      console.error("Failed to fetch recipe data:", error);
      // Let the client component handle loading and error states
    }
  }
  return <RecipeCard />;
}

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  // read route params
  const slug = (await params).slug;

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
    // fetch data
    const { data: recipe } = serverClient.recipe.getRecipeBySlug.useQuery({ slug });
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
