"use client";

import { Card, Div, H2, P } from "@dishify/ui/src";
import { useWindowDimensions, ScrollView } from "react-native";
import { Link } from "solito/link";

// Icons for different cuisines
import { Pizza } from "@dishify/ui/src/icons/pizza";
import { Soup } from "@dishify/ui/src/icons/soup";
import { Beef } from "@dishify/ui/src/icons/beef";
import { Cake } from "@dishify/ui/src/icons/cake";
import { Sandwich } from "@dishify/ui/src/icons/sandwich";
import { Salad } from "@dishify/ui/src/icons/salad";

// Define the cuisine categories
const categories = [
  {
    id: "italian",
    name: "Italian",
    description: "Pasta, pizza and more",
    icon: Pizza,
    color: "bg-indigo-50",
    textColor: "text-indigo-600",
    iconColor: "text-indigo-500",
    borderColor: "border-indigo-100",
  },
  {
    id: "asian",
    name: "Asian",
    description: "Stir-fries and noodles",
    icon: Soup,
    color: "bg-amber-50",
    textColor: "text-amber-600",
    iconColor: "text-amber-500",
    borderColor: "border-amber-100",
  },
  {
    id: "meat",
    name: "Meat Dishes",
    description: "Hearty protein meals",
    icon: Beef,
    color: "bg-emerald-50",
    textColor: "text-emerald-600",
    iconColor: "text-emerald-500",
    borderColor: "border-emerald-100",
  },
  {
    id: "desserts",
    name: "Desserts",
    description: "Sweet treats",
    icon: Cake,
    color: "bg-purple-50",
    textColor: "text-purple-600",
    iconColor: "text-purple-500",
    borderColor: "border-purple-100",
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    description: "Quick and easy",
    icon: Sandwich,
    color: "bg-orange-50",
    textColor: "text-orange-600",
    iconColor: "text-orange-500",
    borderColor: "border-orange-100",
  },
  {
    id: "salads",
    name: "Salads",
    description: "Fresh and nutritious",
    icon: Salad,
    color: "bg-green-50",
    textColor: "text-green-600",
    iconColor: "text-green-500",
    borderColor: "border-green-100",
  },
];

export function CategoriesSection() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardSize = width < 640 ? (width - 48) / 2 : 160; // Slightly smaller cards to fit better

  return (
    <Div className="py-12 px-4 sm:px-6 w-full max-w-7xl mx-auto">
      <Div className="mb-8 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900">Categories</H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">Browse recipes by cuisine</P>
      </Div>

      <Div className="py-2 overflow-visible px-4 sm:px-6">
        <ScrollView
          horizontal={isMobile}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            isMobile
              ? { paddingRight: 16, paddingTop: 8, paddingBottom: 8 }
              : {
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  rowGap: 24,
                  columnGap: 16,
                  padding: 8, // Add padding to prevent shadow clipping
                }
          }
          className="flex w-full overflow-visible"
        >
          {categories.map((category) => (
            <Link key={category.id} href={`/search?category=${category.id}`}>
              <Card
                className={
                  isMobile
                    ? `mr-4 ${category.color} ${category.borderColor} border p-4 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`
                    : `${category.color} ${category.borderColor} border p-4 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`
                }
                style={{
                  width: cardSize,
                  height: cardSize,
                  borderRadius: 16,
                }}
              >
                <Div className="flex-1 flex flex-col items-center justify-center">
                  <Div
                    className={`rounded-full p-3 mb-3 bg-white shadow-sm transition-all duration-300 ${category.borderColor}`}
                  >
                    <category.icon className={`w-8 h-8 ${category.iconColor}`} />
                  </Div>
                  <P
                    className={`font-semibold text-center ${category.textColor} transition-all duration-300`}
                  >
                    {category.name}
                  </P>
                  <P
                    className={`text-xs text-center mt-1 ${category.textColor} opacity-80 transition-all duration-300`}
                  >
                    {category.description}
                  </P>
                </Div>
              </Card>
            </Link>
          ))}
        </ScrollView>
      </Div>
    </Div>
  );
}
