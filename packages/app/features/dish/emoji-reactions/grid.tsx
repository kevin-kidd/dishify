import { View, Pressable } from "react-native";
import { MotiView } from "moti";
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
            "flex aspect-square items-center justify-center rounded-lg p-2 active:bg-gray-100",
            !isSignedIn && "cursor-not-allowed opacity-50",
          )}
        >
          <MotiView
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex items-center justify-center"
            from={{ scale: 0.8 }}
            exit={{ scale: 0.8, opacity: 0 }}
            exitTransition={{ type: "timing", duration: 100 }}
          >
            <Text className="text-2xl">{emoji}</Text>
          </MotiView>
        </Pressable>
      ))}
    </View>
  );
};

export default EmojiGrid;
