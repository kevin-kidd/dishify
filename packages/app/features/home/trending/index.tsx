"use client";

import type { TrendingCardProps } from "./card";
import TrendingCard from "./card";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@dishify/ui/src/elements/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { trpc } from "@dishify/app/utils/trpc";
import type { TrendingRecipe } from "@dishify/api/src/routes/recipe/trending";

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
  },
  slug: "",
  trendingScore: 0,
  estimatedCost: null,
}));

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
    <section className="w-full py-20">
      <div className="mx-auto w-full">
        <div className="mb-8 flex items-center justify-between px-2 sm:px-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold">Trending Recipes</h2>
            <p className="mt-2 text-sage-500 text-sm sm:text-base">
              Discover what others are cooking
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="px-0 sm:px-6">
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
                    prepTime: recipeData.cookingTime.includes("minutes")
                      ? recipeData.cookingTime
                      : `${recipeData.cookingTime} minutes`,
                    href: `/dish/${recipe.slug}`,
                  };
                  return (
                    <CarouselItem
                      key={recipe.id}
                      className="pl-4 md:pl-6 basis-4/5 sm:basis-1/2 lg:basis-[40%]"
                    >
                      <div className="p-4">
                        <TrendingCard {...cardProps} isLoading={isLoading} />
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
