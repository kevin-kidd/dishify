import { HomeScreen } from "app/features/home/screen";
import { serverClient } from "utils/trpc";

export default async function HomePage() {
  // Prefetch trending recipes
  try {
    await serverClient.recipe.trending.query();
  } catch (error) {
    console.error(error);
  }

  return (
    <main>
      <HomeScreen />
    </main>
  );
}
