import { Card, Text } from "@dishify/ui/src";
import { ChevronRight } from "@dishify/ui/src/icons/chevron-right";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";

export type TrendingCardProps = {
  dishName: string;
  cost: number;
  difficulty: "Easy" | "Medium" | "Hard";
  cuisine: string;
  prepTime: string;
};

export default function TrendingCard({
  dishName,
  cost,
  difficulty,
  cuisine,
  prepTime,
}: TrendingCardProps) {
  const getDifficultyColor = (difficulty: TrendingCardProps["difficulty"]) => {
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
  };

  const getCostDisplay = (cost: TrendingCardProps["cost"]) => {
    const dollarSign = <DollarSign className="h-4 w-4" />;
    if (cost > 250) {
      return <div className="flex justify-end text-green-500">{Array(4).fill(dollarSign)}</div>;
    }
    if (cost > 150) {
      return <div className="flex justify-end text-green-500">{Array(3).fill(dollarSign)}</div>;
    }
    if (cost > 50) {
      return <div className="flex justify-end text-green-500">{Array(2).fill(dollarSign)}</div>;
    }
    if (cost > 25) {
      return <div className="flex justify-end text-green-500">{Array(1).fill(dollarSign)}</div>;
    }
    return <div className="flex justify-end text-green-500">{dollarSign}</div>;
  };

  return (
    <Card className="group relative overflow-visible rounded-xl border-0 bg-gradient-to-br from-white to-slate-50 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] cursor-pointer">
      <div className="absolute right-4 top-4">
        <ChevronRight className="h-5 w-5 text-primary/80 transition-transform duration-300 group-hover:translate-x-1" />
      </div>

      <div className="mb-4">
        <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-foreground select-none">
          {cuisine}
        </span>
      </div>

      <h3 className="mb-4 text-xl font-semibold tracking-tight select-none line-clamp-2 min-h-[3.5rem]">
        {dishName}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary/80" />
          <span className="text-sm text-gray-600 select-none">{prepTime}</span>
        </div>

        <div className="flex items-center justify-end">{getCostDisplay(cost)}</div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className={`text-sm font-medium ${getDifficultyColor(difficulty)} select-none`}>
          {difficulty}
        </span>
        <span className="text-xs text-primary/80 select-none">Tap to view recipe</span>
      </div>
    </Card>
  );
}
