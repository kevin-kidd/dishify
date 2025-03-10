"use client";

import { useWindowDimensions } from "react-native";
import { Link } from "solito/link";
import { Card, Div, H2, P, Section, cn } from "@dishify/ui";
import { categories, type RecipeCategorySchema } from "@dishify/api/schemas/category";
import {
  Leaf,
  Wheat,
  Milk,
  Clock,
  Pot,
  Beef,
  Fish,
  Olive,
  Baby,
  Heart,
  Soup,
  Egg,
} from "@dishify/ui/src/icons";
import AutoScroll from "embla-carousel-auto-scroll";
import { Carousel, CarouselContent, CarouselItem } from "@dishify/ui/src/elements/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import type { z } from "zod";

type CategoryName = Exclude<z.infer<typeof RecipeCategorySchema>, "Other">;

const categoryIcons: Record<CategoryName, React.ComponentType<any>> = {
  "Low Carb": Beef,
  Vegetarian: Leaf,
  "Gluten Free": Wheat,
  "Dairy Free": Milk,
  "Quick & Easy": Clock,
  "One Pot": Pot,
  "Budget Friendly": DollarSign,
  "High Protein": Beef,
  Keto: Egg,
  Paleo: Fish,
  Mediterranean: Olive,
  "Kid Friendly": Baby,
  Healthy: Heart,
  "Comfort Food": Soup,
} as const;

const categoryColors: Record<CategoryName, string> = {
  "Low Carb": "bg-green-50 border-green-200",
  Vegetarian: "bg-orange-50 border-orange-200",
  "Gluten Free": "bg-amber-50 border-amber-200",
  "Dairy Free": "bg-blue-50 border-blue-200",
  "Quick & Easy": "bg-purple-50 border-purple-200",
  "One Pot": "bg-emerald-50 border-emerald-200",
  "Budget Friendly": "bg-yellow-50 border-yellow-200",
  "High Protein": "bg-red-50 border-red-200",
  Keto: "bg-indigo-50 border-indigo-200",
  Paleo: "bg-rose-50 border-rose-200",
  Mediterranean: "bg-cyan-50 border-cyan-200",
  "Kid Friendly": "bg-pink-50 border-pink-200",
  Healthy: "bg-lime-50 border-lime-200",
  "Comfort Food": "bg-amber-50 border-amber-200",
} as const;

const categoryIconColors: Record<CategoryName, string> = {
  "Low Carb": "text-green-600",
  Vegetarian: "text-orange-600",
  "Gluten Free": "text-amber-600",
  "Dairy Free": "text-blue-600",
  "Quick & Easy": "text-purple-600",
  "One Pot": "text-emerald-600",
  "Budget Friendly": "text-yellow-600",
  "High Protein": "text-red-600",
  Keto: "text-indigo-600",
  Paleo: "text-rose-600",
  Mediterranean: "text-cyan-600",
  "Kid Friendly": "text-pink-600",
  Healthy: "text-lime-600",
  "Comfort Food": "text-amber-600",
} as const;

const categoryTextColors: Record<CategoryName, string> = {
  "Low Carb": "text-green-800",
  Vegetarian: "text-emerald-800",
  "Gluten Free": "text-amber-800",
  "Dairy Free": "text-blue-800",
  "Quick & Easy": "text-purple-800",
  "One Pot": "text-orange-800",
  "Budget Friendly": "text-yellow-800",
  "High Protein": "text-red-800",
  Keto: "text-indigo-800",
  Paleo: "text-rose-800",
  Mediterranean: "text-cyan-800",
  "Kid Friendly": "text-pink-800",
  Healthy: "text-lime-800",
  "Comfort Food": "text-amber-800",
} as const;

export function CategoriesSection() {
  const { width } = useWindowDimensions();
  const cardSize = width < 640 ? (width - 48) / 2 : 160;

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

  // Filter out the "Other" category
  const filteredCategories = categories.filter((category) => category.name !== "Other");

  return (
    <Section className="w-full pt-12 pb-8 max-w-7xl mx-auto">
      <Div className="mx-auto w-full">
        <Div className="mb-8 px-4 sm:px-6">
          <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">Categories</H2>
          <P className="mt-2 text-sage-500 text-sm sm:text-base">Browse recipes by category</P>
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
              className={cn(
                "w-full",
                "[mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)]",
                "md:[mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)]",
                "[-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%_-_20px),transparent)]",
                "md:[-webkit-mask-image:linear-gradient(to_right,transparent,black_100px,black_calc(100%_-_100px),transparent)]",
              )}
            >
              <CarouselContent className="-ml-4 md:-ml-6 py-4">
                {filteredCategories.map((category) => {
                  const Icon = categoryIcons[category.name];
                  const color = categoryColors[category.name];
                  const iconColor = categoryIconColors[category.name];
                  const textColor = categoryTextColors[category.name];

                  return (
                    <CarouselItem
                      key={category.id}
                      className="pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-1/7"
                    >
                      <Link href={`/category/${category.id}`}>
                        <Card
                          className={cn(
                            color,
                            "border p-4 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105",
                          )}
                          style={{
                            width: cardSize,
                            height: cardSize,
                            borderRadius: 16,
                          }}
                        >
                          <Div className="flex-1 flex flex-col items-center justify-center">
                            <Div
                              className={cn(
                                "rounded-full p-2 mb-3 shadow-sm transition-all duration-300",
                                color,
                                "bg-white",
                              )}
                            >
                              <Icon className={cn("w-6 h-6", iconColor)} />
                            </Div>
                            <P
                              className={cn(
                                "font-semibold text-center transition-all duration-300",
                                textColor,
                              )}
                            >
                              {category.name}
                            </P>
                            <P
                              className={cn(
                                "text-xs text-center mt-1 opacity-80 transition-all duration-300",
                                textColor,
                              )}
                            >
                              {category.description}
                            </P>
                          </Div>
                        </Card>
                      </Link>
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
