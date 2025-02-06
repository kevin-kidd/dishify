import { TrendingSection } from "app/features/home/trending";
import { serverClient } from "utils/trpc";

export default async function HomePage() {
  // Prefetch trending recipes
  await serverClient.recipe.trending.query();

  return (
    <main>
      <TrendingSection />
    </main>
  );
}
