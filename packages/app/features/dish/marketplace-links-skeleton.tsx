import React from "react";
import { View } from "react-native";
import { Skeleton } from "@dishify/ui";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export function MarketplaceLinksSkeleton() {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View className="flex-1 flex-row items-center gap-2.5">
        <Skeleton className="h-10 sm:w-28 w-full rounded-xl" />
      </View>
    </Animated.View>
  );
}
