"use client";

import { TrendingSection } from "./trending";
import { CategoriesSection } from "./categories";
import { FeaturedRecipeSection } from "./featured-recipe";
import { CookingTipsSection } from "./cooking-tips";
import { SeasonalSection } from "./seasonal";
import { Div } from "@dishify/ui/src";

export function HomeScreen() {
  return (
    <Div className="flex flex-col w-full overflow-x-hidden pt-3">
      <TrendingSection />
      <FeaturedRecipeSection />
      <CategoriesSection />
      <SeasonalSection />
      <CookingTipsSection />
    </Div>
  );
}
