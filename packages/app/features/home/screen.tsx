"use client";

import { ScrollView } from "react-native";
import Search from "./search";
import RecipeCard from "./recipe-card";
import { H1, P, Section } from "@dishify/ui/src";
import { TrendingSection } from "./trending";

export function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 16,
      }}
      className="bg-gradient-to-b from-white to-slate-100 h-full w-full py-16"
    >
      <Section className="mb-12 text-center flex flex-col items-center justify-center gap-0">
        <H1 className="animate-fade-up text-5xl font-semibold tracking-tight my-0 py-0">Dishify</H1>
        <P className="mt-4 animate-fade-up text-lg text-gray-600 animation-delay-100">
          Your AI-powered culinary companion
        </P>
      </Section>

      <Search />
      <TrendingSection />
      <RecipeCard />
    </ScrollView>
  );
}
