import { View, Pressable } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { cn, Text } from "@dishify/ui";
import { useRef, useEffect } from "react";

interface EmojiCounterProps {
  emoji: string;
  count: number;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  isSignedIn?: boolean;
}

const EmojiCounter = ({
  emoji,
  count,
  label,
  isSelected,
  onClick,
  isSignedIn = true,
}: EmojiCounterProps) => {
  const prevCount = useRef(count);
  const isIncreasing = useRef(true);

  useEffect(() => {
    isIncreasing.current = count > prevCount.current;
    prevCount.current = count;
  }, [count]);

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
          "relative flex flex-row items-center gap-1.5 px-2 py-1 rounded-full transition-all hover:scale-105 active:scale-95 duration-200",
          "bg-gray-100 active:bg-gray-200 hover:bg-gray-200",
          "border border-gray-200",
          isSelected && "bg-gray-200 border-gray-300",
          !isSignedIn && "cursor-not-allowed opacity-50",
        )}
      >
        <Text className="text-base">{emoji}</Text>
        <View className="relative h-[20px] min-w-[1ch] overflow-hidden">
          <AnimatePresence>
            <MotiView
              key={count}
              from={{
                opacity: 0,
                translateY: isIncreasing.current ? 20 : -20,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
              animate={{
                opacity: 1,
                translateY: 0,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
              exit={{
                opacity: 0,
                translateY: isIncreasing.current ? -20 : 20,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
              transition={{
                type: "timing",
                duration: 150,
              }}
            >
              <Text className="text-sm font-medium text-gray-700 text-center">{count}</Text>
            </MotiView>
          </AnimatePresence>
        </View>
      </Pressable>
    </MotiView>
  );
};

export default EmojiCounter;
