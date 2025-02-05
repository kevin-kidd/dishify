import { cn } from "@dishify/ui";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiCounterProps {
  emoji: string;
  count: number;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const EmojiCounter = ({ emoji, count, label, isSelected, onClick }: EmojiCounterProps) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
        "bg-gray-100 hover:bg-gray-200",
        "border border-gray-200",
        isSelected && "bg-gray-200 border-gray-300",
      )}
      aria-label={`${label} reaction`}
    >
      <span className="text-base">{emoji}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.1 }}
          className="min-w-[1ch] text-sm font-medium text-gray-700"
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default EmojiCounter;
