import { Card, Text } from "@dishify/ui/src";
import { ChevronRight } from "@dishify/ui/src/icons/chevron-right";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { Fragment, useCallback } from "react";
import { Skeleton } from "@dishify/ui";
import { Link } from "solito/link";
import CuisineLabel from "@dishify/ui/src/elements/cuisine-label";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { View } from "react-native";

export type TrendingCardProps = {
  dishName: string;
  cost: number;
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

  const getCostDisplay = useCallback((cost: TrendingCardProps["cost"]) => {
    const count = cost > 250 ? 4 : cost > 150 ? 3 : cost > 50 ? 2 : cost > 25 ? 1 : 1;
    return Array(count).fill(<DollarSign className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />);
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
        className="w-full h-52 group items-start relative overflow-visible rounded-xl border-0 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] cursor-pointer"
        role="button"
        aria-label={`View recipe for ${dishName}`}
      >
        <div className="absolute right-4 top-4">
          <ChevronRight className="h-5 w-5 text-primary/80 transition-transform duration-300 group-hover:translate-x-1" />
        </div>

        <View className="flex flex-col gap-2 h-[60%]">
          <h3 className="text-xl font-semibold tracking-tight select-none">{dishName}</h3>
          <CuisineLabel cuisine={cuisine} />
        </View>

        <div className="grid grid-cols-2 w-full h-[40%]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/80" />
            <span className="text-sm text-gray-600 select-none">{prepTime}</span>
          </div>

          <div className="flex items-center justify-end w-full">
            {getCostDisplay(cost).map((item) => (
              <Fragment key={`dollar-${crypto.randomUUID()}`}>{item}</Fragment>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3 w-full">
          <span className={`text-sm font-medium ${getDifficultyColor(difficulty)} select-none`}>
            {difficulty}
          </span>
          <span className="text-xs text-primary/80 select-none">Tap to view recipe</span>
        </div>
      </Card>
    </Link>
  );
}
