import { Text } from "@dishify/ui/src";
import type { TrendingCardProps } from "./card";
import TrendingCard from "./card";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@dishify/ui/src/elements/carousel";
import { TrendingUp } from "@dishify/ui/src/icons/trending-up";

const TRENDING_DISHES: TrendingCardProps[] = [
  {
    dishName: "Pizza",
    cost: 20,
    difficulty: "Easy",
    cuisine: "Italian",
    prepTime: "30 minutes",
  },
  {
    dishName: "Spaghetti",
    cost: 25,
    difficulty: "Medium",
    cuisine: "Italian",
    prepTime: "45 minutes",
  },
  {
    dishName: "Burger",
    cost: 10,
    difficulty: "Medium",
    cuisine: "American",
    prepTime: "20 minutes",
  },
  {
    dishName: "Tacos",
    cost: 15,
    difficulty: "Hard",
    cuisine: "Mexican",
    prepTime: "30 minutes",
  },
  {
    dishName: "Sushi",
    cost: 30,
    difficulty: "Hard",
    cuisine: "Japanese",
    prepTime: "45 minutes",
  },
];

export function TrendingSection() {
  const plugins = [
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      speed: 1,
      startDelay: 0,
    }),
  ];
  return (
    <section className="w-full py-24">
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-8 flex items-center justify-between px-6">
          <div>
            <h2 className="text-3xl font-semibold">Trending Recipes</h2>
            <p className="mt-2 text-primary">Discover what others are cooking</p>
          </div>
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>

        <div className="relative overflow-hidden">
          <div className="px-6">
            <Carousel
              opts={{
                loop: true,
                align: "start",
                dragFree: true,
              }}
              plugins={plugins}
              className="w-full cursor-grab active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)]"
            >
              <CarouselContent className="-ml-4 md:-ml-6">
                {TRENDING_DISHES.map((dish) => (
                  <CarouselItem
                    key={dish.dishName}
                    className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <div className="p-4">
                      <TrendingCard {...dish} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
