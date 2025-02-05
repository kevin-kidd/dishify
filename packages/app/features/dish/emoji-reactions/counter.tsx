import { View, Pressable } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { cn, Text } from "@dishify/ui";

interface EmojiCounterProps {
  emoji: string;
  count: number;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const EmojiCounter = ({ emoji, count, label, isSelected, onClick }: EmojiCounterProps) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 15 }}
    >
      <Pressable
        onPress={onClick}
        accessibilityLabel={`${label} reaction`}
        className={cn(
          "relative flex flex-row items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
          "bg-gray-100 active:bg-gray-200",
          "border border-gray-200",
          isSelected && "bg-gray-200 border-gray-300",
        )}
      >
        <Text className="text-base">{emoji}</Text>
        <AnimatePresence>
          <MotiView
            key={count}
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 10 }}
            transition={{ type: "timing", duration: 100 }}
            className="min-w-[1ch]"
          >
            <Text className="text-sm font-medium text-gray-700">{count}</Text>
          </MotiView>
        </AnimatePresence>
      </Pressable>
    </MotiView>
  );
};

export default EmojiCounter;
