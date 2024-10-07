"use client";

import { ScrollView, View } from "react-native";
import Search from "./search";
import RecipeCard from "./recipe-card";

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-background p-4">
      <View className="container mx-auto w-full space-y-4 h-full pt-20 max-w-4xl">
        <Search />
        <RecipeCard />
      </View>
    </ScrollView>
  );
}
