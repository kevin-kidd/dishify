import { FavoritesScreen } from "app/features/favorites/screen";
import { serverClient } from "utils/trpc";

export default async function FavoritesPage() {
  try {
    // Prefetch favorites
    await serverClient.recipe.favorites.getFavorites.query();
  } catch (error) {
    console.error(error);
  }

  return <FavoritesScreen />;
}
