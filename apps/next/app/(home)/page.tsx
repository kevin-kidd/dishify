import { TrendingSection } from "app/features/home/trending";
import { serverClient } from "utils/trpc";

export default async function HomePage() {
  // Prefetch trending recipes
  try {
    serverClient.recipe.trending.usePrefetchQuery();
  } catch (error) {
    console.error(error);
  }

  return (
    <main>
      <TrendingSection />
    </main>
  );
}
