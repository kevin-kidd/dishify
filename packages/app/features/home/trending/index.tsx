"use client";

import type { TrendingCardProps } from "./card";
import TrendingCard from "./card";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@dishify/ui/src/elements/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { trpc } from "@dishify/app/utils/trpc";
import type { TrendingRecipe } from "@dishify/api/src/routes/recipe/trending";
import { Div, H2, P, Section } from "@dishify/ui/src";

const LOADING_CARDS: TrendingRecipe[] = Array.from({ length: 4 }, (_, i) => ({
  id: `skeleton-${i}`,
  data: {
    dishName: "",
    difficulty: "Medium",
    cuisine: "Other",
    cookingTime: "30 minutes",
    shoppingList: [],
    instructions: [],
    servings: "",
    category: "Other",
  },
  slug: "",
  trendingScore: 0,
  estimatedCost: null,
}));

/**
 * Formats the preparation time to ensure consistent display
 * Checks if the time string already contains time units, and only adds "minutes" if none are found
 * @param time - The raw cooking/preparation time string
 * @returns Properly formatted time string
 */
function formatPrepTime(time: string): string {
  // Check if time already contains any time-related words
  const timeWords = ["minute", "minutes", "hour", "hours", "hr", "hrs", "min", "mins"];
  const hasTimeUnit = timeWords.some((word) => time.toLowerCase().includes(word));

  // If time already has a time unit, return as is
  if (hasTimeUnit) {
    return time;
  }

  // Otherwise, append "minutes" as the default unit
  return `${time} minutes`;
}

export function TrendingSection() {
  const { data: trendingRecipes, isLoading } = trpc.recipe.trending.useQuery();

  const plugins = [
    WheelGesturesPlugin({ forceWheelAxis: "x" }),
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      speed: 1,
      startDelay: 0,
    }),
  ];

  const recipesToRender: TrendingRecipe[] = isLoading ? LOADING_CARDS : trendingRecipes ?? [];

  return (
    <Section className="w-full pt-12 pb-8 max-w-7xl mx-auto">
      <Div className="mx-auto w-full">
        <Div className="mb-8 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">
            Trending Recipes
          </H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">
            Discover what others are cooking
          </P>
        </Div>

        <Div className="relative overflow-hidden">
          <Div className="px-0 sm:px-6">
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              orientation="horizontal"
              plugins={plugins}
              className="w-full [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)]"
            >
              <CarouselContent className="-ml-4 md:-ml-6">
                {recipesToRender?.map((recipe) => {
                  const recipeData = recipe.data;
                  const cardProps: TrendingCardProps = {
                    dishName: recipeData.dishName,
                    cost: recipe.estimatedCost?.cost ?? 0,
                    difficulty: recipeData.difficulty ?? "Medium",
                    cuisine: recipeData.cuisine,
                    prepTime: formatPrepTime(recipeData.cookingTime),
                    href: `/dish/${recipe.slug}`,
                  };
                  return (
                    <CarouselItem
                      key={recipe.id}
                      className="pl-4 md:pl-6 basis-4/5 sm:basis-1/2 lg:basis-[40%]"
                    >
                      <Div className="p-4">
                        <TrendingCard {...cardProps} isLoading={isLoading} />
                      </Div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </Div>
        </Div>
      </Div>
    </Section>
  );
}
