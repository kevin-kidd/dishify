import { Text, Button } from "@dishify/ui";
import { View } from "react-native";
import { TRPCClientError } from "@trpc/client";

interface ErrorViewProps {
  error: unknown;
  onRetry: () => void;
  onHome: () => void;
}

export function ErrorView({ error, onRetry, onHome }: ErrorViewProps) {
  const isNotFound = error instanceof TRPCClientError && error.data?.code === "NOT_FOUND";
  const isUnknownDish = error instanceof TRPCClientError && error.data?.message.includes("Unknown");

  return (
    <View className="flex h-full items-center justify-center p-4 my-6">
      <View className="flex items-center space-y-4">
        <Text className="text-2xl font-semibold">
          {isNotFound ? "Dish not found" : isUnknownDish ? "Unknown dish" : "Failed to load dish"}
        </Text>
        <Text className="text-center text-gray-500 max-w-[350px]">
          {isNotFound
            ? "The dish you are looking for does not exist. Please check the URL and try again."
            : isUnknownDish
              ? "The dish you are looking for could not be identified. Please try again."
              : "Something went wrong while loading the dish. Please try again later."}
        </Text>
        <View className="flex-row space-x-4">
          <Button onClick={onHome}>
            <Text>Return Home</Text>
          </Button>
          {!isNotFound && (
            <Button variant="outline" onPress={onRetry}>
              <Text>Try Again</Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
