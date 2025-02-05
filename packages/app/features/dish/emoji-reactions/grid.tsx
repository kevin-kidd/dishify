import { motion } from "framer-motion";
import { View } from "react-native";

interface Reaction {
  emoji: string;
  label: string;
}

interface EmojiGridProps {
  reactions: readonly Reaction[];
  onSelect: (emoji: string) => void;
}

const EmojiGrid = ({ reactions, onSelect }: EmojiGridProps) => {
  return (
    <View className="grid grid-cols-3 gap-1 p-2">
      {reactions.map(({ emoji, label }) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex aspect-square items-center justify-center rounded-lg p-2 hover:bg-gray-100"
          onClick={() => onSelect(emoji)}
          aria-label={label}
        >
          <span className="text-2xl">{emoji}</span>
        </motion.button>
      ))}
    </View>
  );
};

export default EmojiGrid;
