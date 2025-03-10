"use client";

import { Card, cn, H3, Span } from "@dishify/ui/src";
import { ChevronRight } from "@dishify/ui/src/icons/chevron-right";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { useCallback } from "react";
import { Skeleton } from "@dishify/ui";
import { Link } from "solito/link";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { getCostIndicators } from "../../../dish/cost-indicators";
import { View } from "react-native";

export type TrendingCardProps = {
  dishName: string;
  cost: number; // Cost in cents
  difficulty: "Easy" | "Medium" | "Hard";
  cuisine: RecipeResponse["cuisine"];
  prepTime: string;
  isLoading?: boolean;
  href: string;
};

export default function TrendingCard({
  dishName,
  cost,
  difficulty,
  cuisine,
  prepTime,
  isLoading,
  href,
}: TrendingCardProps) {
  const getDifficultyColor = useCallback((difficulty: TrendingCardProps["difficulty"]) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500";
      case "Medium":
        return "text-yellow-500";
      case "Hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  }, []);

  const getCostDisplay = useCallback((costValue: number) => {
    // Create a mock estimatedCosts object with the cost value
    const mockEstimatedCosts = {
      us: {
        cost: costValue,
        updatedAt: new Date().toISOString(),
        missingIngredientsCount: 0,
        totalIngredientsCount: 1,
      },
    };

    // Use the shared getCostIndicators function
    return (
      getCostIndicators(mockEstimatedCosts) || (
        // Fallback if getCostIndicators returns null
        <View className="flex flex-row items-center gap-1">
          <DollarSign
            className="sm:h-4 sm:w-4 h-[14px] w-[14px] text-[#13a300]"
            strokeWidth={2.5}
          />
        </View>
      )
    );
  }, []);

  if (isLoading) {
    return (
      <Card className="space-y-4 h-52" key={`trending-card-skeleton-${dishName}`}>
        <Skeleton className="h-full w-full" />
      </Card>
    );
  }

  return (
    <Link href={href}>
      <Card
        key={`trending-card-${dishName}`}
        className="w-full h-48 sm:h-52 group items-start relative overflow-visible rounded-xl border-0 bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] cursor-pointer"
        role="button"
        aria-label={`View recipe for ${dishName}`}
      >
        <View className="absolute right-4 top-4">
          <ChevronRight className="h-5 w-5 text-primary/80 transition-transform duration-300 group-hover:translate-x-1" />
        </View>

        <View className="flex flex-col gap-2 h-[60%] w-[90%]">
          <View className="w-full overflow-hidden">
            <H3 className="text-lg sm:text-xl font-semibold tracking-tight py-0 my-0 select-none truncate text-left">
              {dishName}
            </H3>
          </View>
          <CuisineLabel cuisine={cuisine} />
        </View>

        <View className="grid grid-cols-3 w-full mb-2">
          <View className="flex flex-row items-center gap-2 col-span-2">
            <Clock className="h-4 w-4 text-primary/80" />
            <Span className="text-xs sm:text-sm text-gray-600 select-none w-full text-left truncate">
              {prepTime}
            </Span>
          </View>

          <View className="flex flex-row items-center justify-end">
            {cost > 0 && getCostDisplay(cost)}
          </View>
        </View>

        <View className="mt-2 flex flex-row items-center justify-between border-t border-border w-full pt-3">
          <Span
            className={cn(
              "text-xs sm:text-sm font-medium select-none",
              getDifficultyColor(difficulty),
            )}
          >
            {difficulty}
          </Span>
          <Span className="text-xs text-primary/80 select-none">Tap to view recipe</Span>
        </View>
      </Card>
    </Link>
  );
}
