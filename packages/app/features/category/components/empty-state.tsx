import React from "react";
import { View } from "react-native";
import { H2, P } from "@dishify/ui/src";
import { SearchX } from "lucide-react-native";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-4 py-12 md:py-20">
      <SearchX className="w-16 h-16 text-sage-400 mb-4" />
      <H2 className="text-xl md:text-2xl font-bold text-sage-900 mb-2 text-center">
        No Recipes Found
      </H2>
      <P className="text-sage-600 text-center max-w-md">
        We couldn't find any recipes matching your filters. Try adjusting your search criteria to
        see more results.
      </P>
    </View>
  );
}
