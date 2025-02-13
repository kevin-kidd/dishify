import React from "react";
import { View } from "react-native";
import { Skeleton } from "@dishify/ui";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export function MarketplaceLinksSkeleton() {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View className="flex flex-row items-center gap-2.5">
        <Skeleton className="h-10 w-28 rounded-xl" />
      </View>
    </Animated.View>
  );
}
