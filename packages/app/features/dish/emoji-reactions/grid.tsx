import { View, Pressable } from "react-native";
import { cn, Text } from "@dishify/ui";

interface Reaction {
  emoji: string;
  label: string;
}

interface EmojiGridProps {
  reactions: readonly Reaction[];
  onSelect: (emoji: string) => void;
  isSignedIn?: boolean;
}

const EmojiGrid = ({ reactions, onSelect, isSignedIn = true }: EmojiGridProps) => {
  return (
    <View className="grid grid-cols-3 gap-1 p-2">
      {reactions.map(({ emoji, label }) => (
        <Pressable
          key={emoji}
          onPress={() => onSelect(emoji)}
          accessibilityLabel={label}
          className={cn(
            "flex aspect-square items-center justify-center rounded-lg p-2 active:bg-gray-100 group hover:bg-gray-200 transition-colors duration-200",
            !isSignedIn && "cursor-not-allowed opacity-50",
          )}
        >
          <Text className="text-2xl group-hover:scale-110 transition-all duration-200">
            {emoji}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default EmojiGrid;
