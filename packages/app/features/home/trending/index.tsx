import type { TrendingCardProps } from "./card";
import TrendingCard from "./card";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@dishify/ui/src/elements/carousel";
import { TrendingUp } from "@dishify/ui/src/icons/trending-up";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

const TRENDING_DISHES: TrendingCardProps[] = [
  {
    dishName: "Spaghetti Carbonara",
    cost: 150,
    difficulty: "Easy",
    cuisine: "Italian",
    prepTime: "30 minutes",
    href: "/dish/spaghetti-carbonara-abc123",
  },
  {
    dishName: "Chicken Tikka Masala",
    cost: 250,
    difficulty: "Medium",
    cuisine: "Indian",
    prepTime: "45 minutes",
    href: "/dish/chicken-tikka-masala-def456",
  },
  {
    dishName: "Beef Tacos",
    cost: 100,
    difficulty: "Medium",
    cuisine: "Mexican",
    prepTime: "20 minutes",
    href: "/dish/beef-tacos-ghi789",
  },
  {
    dishName: "Pad Thai",
    cost: 180,
    difficulty: "Hard",
    cuisine: "Thai",
    prepTime: "30 minutes",
    href: "/dish/pad-thai-jkl012",
  },
  {
    dishName: "Sushi Rolls",
    cost: 300,
    difficulty: "Hard",
    cuisine: "Japanese",
    prepTime: "45 minutes",
    href: "/dish/sushi-rolls-mno345",
  },
];

export function TrendingSection() {
  const plugins = [
    WheelGesturesPlugin(),
    AutoScroll({
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      speed: 1,
      startDelay: 0,
    }),
  ];
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
          <div className="px-6">
            <Carousel
              opts={{
                loop: true,
                align: "start",
              }}
              orientation="horizontal"
              plugins={plugins}
              draggable
              className="w-full [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)] md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)]"
            >
              <CarouselContent className="-ml-4 md:-ml-6">
                {TRENDING_DISHES.map((dish) => (
                  <CarouselItem
                    key={dish.dishName}
                    className="pl-4 md:pl-6 basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <div className="p-4">
                      <TrendingCard {...dish} isLoading={false} />
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
