import { notFound } from "next/navigation";
import { serverClient } from "utils/trpc";
import { categories, type Category } from "@dishify/api/schemas/category";
import { CategoryScreen } from "app/features/category/screen";
import type { Metadata } from "next";

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return notFound();

  // Check if the category exists
  const category = categories.find((c: Category) => c.id === id);
  if (!category) return notFound();

  // Fetch initial data server-side
  try {
    await Promise.all([
      serverClient.recipe.getRecipesByCategory.query({ category: category.name }),
      serverClient.recipe.getRecipesByCategoryCount.query({ category: category.name }),
    ]);
  } catch (error) {
    console.error("Failed to fetch category data:", error);
    // Let the client component handle loading and error states
  }

  return <CategoryScreen category={category} />;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const category = categories.find((c: Category) => c.id === id);

  if (!category) {
    return {
      title: "Dishify - Category not found",
      description: "The category you are looking for does not exist",
    };
  }

  return {
    title: {
      template: "%s - Dishify",
      absolute: `${category.name} Recipes - Dishify`,
      default: "Dishify",
    },
    description: category.description,
  };
}
