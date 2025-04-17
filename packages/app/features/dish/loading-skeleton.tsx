import { Card, CardHeader, CardContent, Skeleton, Section } from "@dishify/ui";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

export function LoadingSkeleton() {
  return (
    <Section className="max-w-6xl mx-auto px-4 pt-14 w-full">
      <Animated.View
        entering={FadeIn}
        layout={LinearTransition.springify().mass(0.8).damping(15).stiffness(100)}
      >
        <Card className="overflow-visible border-0 shadow-lg">
          <CardHeader className="pt-8 pb-5 px-6 sm:px-10 border-b border-sage-100">
            <View className="flex flex-col">
              <View className="flex flex-row items-center justify-between w-full mb-3">
                <View className="flex-1 min-w-0">
                  <Skeleton className="h-10 w-3/4" />
                </View>
                <View className="flex flex-row items-center gap-1.5">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </View>
              </View>
              <Skeleton className="h-6 w-24 mt-2" />
              <View className="mt-6 flex flex-row items-center flex-wrap gap-4">
                <Skeleton className="h-5 w-[28%] sm:w-20" />
                <Skeleton className="h-5 w-[32%] sm:w-24" />
                <Skeleton className="h-5 w-[28%] sm:w-20" />
              </View>
            </View>
          </CardHeader>

          <CardContent className="grid gap-12 p-8 lg:grid-cols-[1fr_400px]">
            <View className="space-y-8">
              <View>
                <Skeleton className="h-7 w-32 mb-6" />
                <View className="relative space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <View key={crypto.randomUUID()} className="group relative">
                      <View className="absolute left-[13.5px] top-[31px] h-[calc(100%+8px)] w-0.5 bg-sage-100" />
                      <View className="flex flex-row items-start gap-6">
                        <View className="relative flex flex-col items-center pt-1.5 w-7">
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </View>
                        <View className="flex-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4 mt-2" />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="space-y-8">
              <View>
                <Skeleton className="h-7 w-32 mb-6" />
                <View className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-sage-100">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <View
                      key={crypto.randomUUID()}
                      className="flex flex-row items-center justify-between border-b border-sage-50 py-3 last:border-0"
                    >
                      <View className="flex-1">
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </View>
                      <Skeleton className="h-8 w-24" />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </Animated.View>
    </Section>
  );
}
