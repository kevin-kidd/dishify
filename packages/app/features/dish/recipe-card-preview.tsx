"use client";

import { Card, Div, P } from "@dishify/ui/src";
import { Image } from "react-native";
import { Link } from "solito/link";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { ArrowRight } from "lucide-react-native";
import type { Recipe } from "@dishify/api/schemas/recipe";

interface RecipeCardPreviewProps {
  recipe: Recipe;
}

// Function to get color based on difficulty
function getDifficultyColor(difficulty: string) {
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
}

// Function to generate cost indicators
function getCostDisplay(cost: number) {
  const count = cost > 10000 ? 4 : cost > 5000 ? 3 : cost > 2500 ? 2 : 1;
  return Array(count).fill(<DollarSign className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />);
}

export function RecipeCardPreview({ recipe }: RecipeCardPreviewProps) {
  const imageUrl = recipe.imageUrl || "https://via.placeholder.com/400x300?text=No+Image";

  return (
    <Link href={`/dish/${recipe.slug}`}>
      <Card className="overflow-hidden border-0 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full flex flex-col group">
        <Div className="aspect-video relative overflow-hidden">
          <Div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10" />
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
            accessibilityLabel={recipe.data.dishName}
            resizeMode="cover"
          />
        </Div>
        <Div className="p-5 flex-1 flex flex-col">
          <P className="font-semibold text-lg text-sage-900 mb-1 group-hover:text-sage-700 transition-colors duration-300">
            {recipe.data.dishName}
          </P>
          <P className="text-sage-600 text-sm mb-4 group-hover:text-sage-500 transition-colors duration-300">
            {recipe.description || "A delicious recipe waiting to be discovered"}
          </P>

          <Div className="mt-auto">
            <Div className="flex flex-row items-center justify-between mb-3">
              <Div className="flex flex-row items-center gap-2">
                <Clock className="h-4 w-4 text-sage-500" />
                <P className="text-xs text-sage-600">{recipe.data.cookingTime}</P>
              </Div>

              <Div className="flex flex-row items-center justify-end">
                {recipe.data.cost > 0 &&
                  getCostDisplay(recipe.data.cost).map((item, index) => (
                    <Div
                      key={`dollar-${recipe.id}-${index}`}
                      className="transition-all duration-300 transform group-hover:scale-110"
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      {item}
                    </Div>
                  ))}
              </Div>
            </Div>

            <Div className="pt-3 border-t border-sage-100 flex flex-row items-center justify-between">
              <P
                className={`text-xs font-medium ${getDifficultyColor(
                  recipe.data.difficulty,
                )} transition-all duration-300 group-hover:font-semibold`}
              >
                {recipe.data.difficulty}
              </P>
              <P className="text-xs text-sage-500 group-hover:text-sage-700 transition-colors duration-300 flex items-center">
                View recipe
                <ArrowRight className="w-3 h-3 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </P>
            </Div>
          </Div>
        </Div>
      </Card>
    </Link>
  );
}
