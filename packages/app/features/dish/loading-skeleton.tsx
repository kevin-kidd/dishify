import { Card, CardHeader, CardContent, Skeleton } from "@dishify/ui";
import { View } from "react-native";

export function LoadingSkeleton() {
  return (
    <Card className="p-4">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2 mt-4" />
      </CardHeader>

      <CardContent>
        <Skeleton className="h-6 w-48 mb-4" />
        <View className="space-y-2 mb-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </View>

        <Skeleton className="h-6 w-48 mb-4" />
        <View className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </View>
      </CardContent>
    </Card>
  );
}
