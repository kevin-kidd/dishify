import { HomeScreen } from "app/features/home/screen";
import { serverClient } from "utils/trpc";
import type { Metadata } from "next";

const description =
  "Dishify: Your AI-powered culinary companion. Enter any dish name for instant recipes, ingredient lists, and smart shopping links. Elevate your cooking with personalized instructions and effortless grocery planning.";

export const metadata: Metadata = {
  title: "Dishify - AI-Powered Recipe Generator",
  description: description,
  openGraph: {
    title: "Dishify - AI-Powered Recipe Generator",
    description: description,
    url: "https://dishify.app/",
    siteName: "Dishify",
    type: "website",
  },
};

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
