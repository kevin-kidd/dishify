import { FavoritesScreen } from "app/features/favorites/screen";
import { serverClient } from "utils/trpc";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites - Dishify",
  description: "View and manage your favorite recipes on Dishify for quick access anytime.",
  openGraph: {
    title: "Favorites - Dishify",
    description: "View and manage your favorite recipes on Dishify for quick access anytime.",
    url: "https://dishify.app/favorites",
  },
};

export default async function FavoritesPage() {
  try {
    // Prefetch favorites
    await serverClient.recipe.favorites.getFavorites.query();
  } catch (error) {
    console.error(error);
  }

  return <FavoritesScreen />;
}
