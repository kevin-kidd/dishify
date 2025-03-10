"use client";

import { TrendingSection } from "./sections/trending";
import { FeaturedRecipeSection } from "./sections/featured-recipe";
import { CookingTipsSection } from "./sections/cooking-tips";
import { SeasonalSection } from "./sections/seasonal";
import { Div } from "@dishify/ui/src";
import { CategoriesSection } from "./sections/categories";

export function HomeScreen() {
  return (
    <Div className="flex flex-col w-full overflow-x-hidden pt-3">
      <TrendingSection />
      <SeasonalSection />
      <FeaturedRecipeSection />
      <CategoriesSection />
      <CookingTipsSection />
    </Div>
  );
}
