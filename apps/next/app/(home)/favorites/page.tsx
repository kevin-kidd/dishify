import { FavoritesScreen } from "app/features/favorites/screen";
import { serverClient } from "utils/trpc";

export default async function FavoritesPage() {
  try {
    // Prefetch favorites
    serverClient.recipe.favorites.getFavorites.usePrefetchQuery();
  } catch (error) {
    console.error(error);
  }

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your Favorites</h1>
      <FavoritesScreen />
    </main>
  );
}
