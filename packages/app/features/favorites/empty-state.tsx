import { View } from "react-native";
import { Text } from "@dishify/ui/src";
import { Star } from "@dishify/ui/src/icons/star";
import { Link } from "solito/link";

export function EmptyState() {
  return (
    <View className="flex flex-col items-center justify-center py-12 px-4">
      <Star className="h-12 w-12 text-yellow-500 mb-4" />
      <Text className="text-2xl font-semibold text-center mb-2">No favorites yet</Text>
      <Text className="text-muted-foreground text-center mb-6">
        Start exploring recipes and save your favorites to see them here
      </Text>
      <Link href="/">
        <Text className="text-primary hover:underline">Explore Recipes</Text>
      </Link>
    </View>
  );
}
