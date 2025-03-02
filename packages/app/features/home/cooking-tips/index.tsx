"use client";

import { useState } from "react";
import { Card, Div, H2, H3, P, Section } from "@dishify/ui/src";
import { Pressable, useWindowDimensions } from "react-native";
import { Link } from "solito/link";
import { Knife } from "@dishify/ui/src/icons/knife";
import { Flame } from "@dishify/ui/src/icons/flame";
import { Scale } from "@dishify/ui/src/icons/scale";
import { ChefHat } from "@dishify/ui/src/icons/chef-hat";
import { MotiView } from "moti";

// Define the type for cooking tips
type CookingTip = {
  id: string;
  text: string;
};

// Define the type for a category of cooking tips
type CookingTipCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  tips: CookingTip[];
};

// Define the cooking tips data
const cookingTips: CookingTipCategory[] = [
  {
    id: "knife-skills",
    name: "Knife Skills",
    icon: <Knife className="w-5 h-5 text-sage-700" />,
    tips: [
      {
        id: "knife-1",
        text: "Keep your knife sharp—a sharp knife is safer than a dull one as it requires less force and is less likely to slip.",
      },
      {
        id: "knife-2",
        text: "The 'claw' technique: curl your fingertips under and use your knuckles as a guide for the knife while cutting.",
      },
      {
        id: "knife-3",
        text: "For precise dicing, use a rocking motion keeping the tip of the knife on the cutting board.",
      },
    ],
  },
  {
    id: "cooking-temperatures",
    name: "Cooking Temperatures",
    icon: <Flame className="w-5 h-5 text-sage-700" />,
    tips: [
      {
        id: "temp-1",
        text: "Low heat (275-300°F) is best for slow cooking stews, braising tough cuts of meat, and simmering sauces.",
      },
      {
        id: "temp-2",
        text: "Medium heat (325-350°F) is ideal for cooking pancakes, eggs, and most sautéing tasks.",
      },
      {
        id: "temp-3",
        text: "High heat (375-450°F) is perfect for searing meat and creating caramelization.",
      },
    ],
  },
  {
    id: "measuring-techniques",
    name: "Measuring Techniques",
    icon: <Scale className="w-5 h-5 text-sage-700" />,
    tips: [
      {
        id: "measure-1",
        text: "For dry ingredients, fill the measuring cup to the top and level off with a straight edge.",
      },
      {
        id: "measure-2",
        text: "For liquid ingredients, use a clear measuring cup with a pour spout and read at eye level.",
      },
      {
        id: "measure-3",
        text: "Consider investing in a kitchen scale for the most accurate measurements, especially for baking.",
      },
    ],
  },
  {
    id: "flavor-balancing",
    name: "Flavor Balancing",
    icon: <ChefHat className="w-5 h-5 text-sage-700" />,
    tips: [
      {
        id: "flavor-1",
        text: "Balance dishes with the five basic tastes: sweet, salty, sour, bitter, and umami.",
      },
      {
        id: "flavor-2",
        text: "Add a splash of acid (lemon juice, vinegar) to brighten flavors in rich dishes.",
      },
      {
        id: "flavor-3",
        text: "Taste as you cook and adjust seasonings gradually.",
      },
    ],
  },
];

export function CookingTipsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(cookingTips[0]?.id || "");
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Find the currently active category
  const selectedCategory = cookingTips.find((category) => category.id === activeCategory);
  const tips = selectedCategory?.tips || [];

  return (
    <Section className="pt-12 pb-8 w-full max-w-7xl mx-auto">
      <Div className="mb-4 px-4 sm:px-6">
        <H2 className="text-2xl sm:text-3xl font-semibold text-sage-900 mb-0">Cooking Tips</H2>
        <P className="mt-2 text-sage-500 text-sm sm:text-base">
          Master essential techniques in your kitchen
        </P>
      </Div>

      <Card className="p-0 overflow-hidden border-0 rounded-xl shadow-md mx-4 sm:mx-6">
        <Div className={`flex flex-col ${!isMobile ? "sm:flex-row" : ""}`}>
          {/* Sidebar for categories */}
          <Div
            className={`${!isMobile ? "sm:w-1/3 md:w-1/4" : ""} bg-sage-50 border-r border-sage-100`}
          >
            <Div
              className={`flex ${isMobile ? "flex-row overflow-x-auto py-3" : "flex-col p-3 my-auto"}`}
            >
              {cookingTips.map((category) => (
                <Div
                  key={category.id}
                  className={`${isMobile ? "min-w-[140px] flex-shrink-0 mx-1" : "mb-2 last:mb-0"}`}
                >
                  <Pressable onPress={() => setActiveCategory(category.id)}>
                    <Div
                      className={`flex flex-row items-center p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                        activeCategory === category.id
                          ? "bg-white text-sage-900 shadow-sm"
                          : "text-sage-600 hover:bg-white hover:shadow-sm hover:text-sage-900"
                      }`}
                    >
                      <Div
                        className={`mr-3 ml-1 flex-shrink-0 transition-transform duration-300 ${
                          activeCategory === category.id ? "scale-110" : ""
                        }`}
                      >
                        {category.icon}
                      </Div>
                      <P
                        className={`${
                          activeCategory === category.id ? "font-medium" : ""
                        } flex-shrink text-sm transition-colors duration-300`}
                      >
                        {category.name}
                      </P>
                    </Div>
                  </Pressable>
                </Div>
              ))}
            </Div>
          </Div>

          {/* Content area */}
          <Div className={`${!isMobile ? "sm:w-2/3 md:w-3/4" : ""} p-5 sm:p-6`}>
            {selectedCategory && (
              <Div>
                <H3 className="text-xl font-medium text-sage-900 mb-4 flex items-center">
                  {selectedCategory.icon && <Div className="mr-2">{selectedCategory.icon}</Div>}
                  {selectedCategory.name}
                </H3>
                <Div className="space-y-5">
                  {tips.map((tip, index) => (
                    <Div
                      key={tip.id}
                      className="pb-4 border-b border-sage-100 last:border-0 last:pb-0"
                    >
                      <MotiView
                        from={{
                          opacity: 0,
                          translateY: 10,
                        }}
                        animate={{
                          opacity: 1,
                          translateY: 0,
                        }}
                        transition={{
                          type: "timing",
                          duration: 400,
                          delay: index * 100, // Staggered delay based on index
                        }}
                      >
                        <P className="text-sage-700 leading-relaxed">{tip.text}</P>
                      </MotiView>
                    </Div>
                  ))}
                </Div>
              </Div>
            )}
          </Div>
        </Div>
      </Card>
    </Section>
  );
}
