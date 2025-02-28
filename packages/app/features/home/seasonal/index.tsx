"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { Card, Div, H2, P, Section } from "@dishify/ui/src";
import { Image, useWindowDimensions } from "react-native";
import { Link } from "solito/link";
import { getFoodImageUrl } from "@dishify/app/utils/food-images";
import { Clock } from "@dishify/ui/src/icons/clock";
import { DollarSign } from "@dishify/ui/src/icons/dollar-sign";
import { ArrowRight } from "lucide-react-native";

// Determine current season based on the date
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();

  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

// Seasonal recipe suggestions with direct image URLs
const seasonalRecipes = {
  spring: [
    {
      id: "spring-asparagus-risotto",
      name: "Spring Asparagus Risotto",
      description: "A creamy rice dish with fresh asparagus and lemon",
      cookingTime: "35 minutes",
      difficulty: "Medium",
      cost: 3000, // Estimated cost in cents
      searchQuery: "spring asparagus risotto recipe",
    },
    {
      id: "strawberry-spinach-salad",
      name: "Strawberry Spinach Salad",
      description: "Fresh spinach with seasonal strawberries and balsamic",
      cookingTime: "15 minutes",
      difficulty: "Easy",
      cost: 2200, // Estimated cost in cents
      searchQuery: "strawberry spinach salad recipe",
    },
    {
      id: "spring-pea-soup",
      name: "Spring Pea Soup",
      description: "Bright and fresh soup with mint and crème fraîche",
      cookingTime: "25 minutes",
      difficulty: "Easy",
      cost: 1800, // Estimated cost in cents
      searchQuery: "spring pea soup recipe",
    },
  ],
  summer: [
    {
      id: "grilled-peach-salad",
      name: "Grilled Peach Salad",
      description: "Sweet grilled peaches with arugula and goat cheese",
      cookingTime: "20 minutes",
      difficulty: "Easy",
      cost: 2500, // Estimated cost in cents
      searchQuery: "grilled peach arugula salad recipe",
    },
    {
      id: "chilled-gazpacho",
      name: "Chilled Gazpacho",
      description: "Refreshing Spanish cold soup with summer vegetables",
      cookingTime: "30 minutes",
      difficulty: "Medium",
      cost: 2000, // Estimated cost in cents
      searchQuery: "chilled gazpacho recipe",
    },
    {
      id: "bbq-corn-on-cob",
      name: "BBQ Corn on the Cob",
      description: "Grilled corn with herb butter and spices",
      cookingTime: "15 minutes",
      difficulty: "Easy",
      cost: 1200, // Estimated cost in cents
      searchQuery: "bbq corn on the cob recipe",
    },
  ],
  autumn: [
    {
      id: "pumpkin-soup",
      name: "Roasted Pumpkin Soup",
      description: "Creamy, warming soup with roasted pumpkin and spices",
      cookingTime: "45 minutes",
      difficulty: "Medium",
      cost: 2800, // Estimated cost in cents
      searchQuery: "roasted pumpkin soup recipe",
    },
    {
      id: "apple-crisp",
      name: "Apple Crisp",
      description: "Baked apples with a crunchy cinnamon topping",
      cookingTime: "50 minutes",
      difficulty: "Medium",
      cost: 2300, // Estimated cost in cents
      searchQuery: "apple crisp dessert recipe",
    },
    {
      id: "mushroom-risotto",
      name: "Wild Mushroom Risotto",
      description: "Rich and earthy risotto with seasonal mushrooms",
      cookingTime: "40 minutes",
      difficulty: "Medium",
      cost: 3500, // Estimated cost in cents
      searchQuery: "wild mushroom risotto recipe",
    },
  ],
  winter: [
    {
      id: "beef-stew",
      name: "Hearty Beef Stew",
      description: "Slow-cooked beef with winter vegetables",
      cookingTime: "2 hours",
      difficulty: "Medium",
      cost: 4500, // Estimated cost in cents
      searchQuery: "hearty beef stew recipe",
    },
    {
      id: "butternut-squash-soup",
      name: "Butternut Squash Soup",
      description: "Smooth, velvety soup with roasted squash",
      cookingTime: "45 minutes",
      difficulty: "Easy",
      cost: 2200, // Estimated cost in cents
      searchQuery: "butternut squash soup recipe",
    },
    {
      id: "gingerbread-cookies",
      name: "Gingerbread Cookies",
      description: "Spiced holiday cookies with molasses",
      cookingTime: "35 minutes",
      difficulty: "Medium",
      cost: 1800, // Estimated cost in cents
      searchQuery: "gingerbread cookies recipe",
    },
  ],
};

export function SeasonalSection() {
  const [season, setSeason] = useState("winter");
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Set the current season on component mount
  useEffect(() => {
    setSeason(getCurrentSeason());
  }, []);

  // Function to get color based on difficulty
  const getDifficultyColor = useCallback((difficulty: string) => {
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

  // Function to generate cost indicators
  const getCostDisplay = useCallback((cost: number) => {
    const count = cost > 10000 ? 4 : cost > 5000 ? 3 : cost > 2500 ? 2 : 1;
    return Array(count).fill(<DollarSign className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />);
  }, []);

  const recipes = seasonalRecipes[season as keyof typeof seasonalRecipes];
  const seasonName = season.charAt(0).toUpperCase() + season.slice(1);

  return (
    <Section className="py-12 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <Div className="mb-8 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900">{seasonName} Favorites</H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">Seasonal dishes to try now</P>
      </Div>

      <Div
        className={`grid grid-cols-1 ${
          isMobile ? "" : "sm:grid-cols-2 md:grid-cols-3"
        } gap-6 sm:gap-8 px-4 sm:px-6`}
      >
        {recipes.map((recipe) => {
          // Get an appropriate image based on the recipe name and season
          const imageUrl = getFoodImageUrl(recipe.name, "", season);

          return (
            <Link key={recipe.id} href={`/?dishName=${encodeURIComponent(recipe.searchQuery)}`}>
              <Card className="overflow-hidden border-0 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full flex flex-col group">
                <Div className="aspect-video relative overflow-hidden">
                  <Div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10" />
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-full transition-transform duration-700 ease-in-out group-hover:scale-110"
                    accessibilityLabel={recipe.name}
                    resizeMode="cover"
                  />
                </Div>
                <Div className="p-5 flex-1 flex flex-col">
                  <P className="font-semibold text-lg text-sage-900 mb-1 group-hover:text-sage-700 transition-colors duration-300">
                    {recipe.name}
                  </P>
                  <P className="text-sage-600 text-sm mb-4 group-hover:text-sage-500 transition-colors duration-300">
                    {recipe.description}
                  </P>

                  <Div className="mt-auto">
                    <Div className="flex flex-row items-center justify-between mb-3">
                      <Div className="flex flex-row items-center gap-2">
                        <Clock className="h-4 w-4 text-sage-500" />
                        <P className="text-xs text-sage-600">{recipe.cookingTime}</P>
                      </Div>

                      <Div className="flex flex-row items-center justify-end">
                        {recipe.cost > 0 &&
                          getCostDisplay(recipe.cost).map((item, index) => (
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
                          recipe.difficulty,
                        )} transition-all duration-300 group-hover:font-semibold`}
                      >
                        {recipe.difficulty}
                      </P>
                      <P className="text-xs text-sage-500 group-hover:text-sage-700 transition-colors duration-300 flex items-center">
                        Tap to view recipe
                        <ArrowRight className="w-3 h-3 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                      </P>
                    </Div>
                  </Div>
                </Div>
              </Card>
            </Link>
          );
        })}
      </Div>
    </Section>
  );
}
