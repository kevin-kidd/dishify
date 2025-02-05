import { useState, useCallback, useMemo } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@dishify/ui";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "app/utils/trpc";
import { toast } from "app/utils/toast";
import EmojiGrid from "./grid";
import EmojiCounter from "./counter";

interface Reaction {
  emoji: string;
  label: string;
}

// Define thumbs up separately to ensure type safety
const THUMBS_UP_REACTION: Reaction = { emoji: "👍", label: "Like" };

const AVAILABLE_REACTIONS: readonly Reaction[] = [
  THUMBS_UP_REACTION,
  { emoji: "👎", label: "Dislike" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "😋", label: "Yummy" },
  { emoji: "🤤", label: "Drooling" },
  { emoji: "😍", label: "Love" },
];

interface EmojiReactionsProps {
  recipeId: string;
}

export const EmojiReactions = ({ recipeId }: EmojiReactionsProps) => {
  const utils = trpc.useUtils();

  // Fetch reactions
  const { data: reactions = [] } = trpc.recipe.reactions.getReactions.useQuery(
    { recipeId },
    {
      initialData: [], // Start with empty array while loading
      refetchOnWindowFocus: false,
    },
  );

  // Toggle reaction mutation
  const toggleReaction = trpc.recipe.reactions.toggleReaction.useMutation({
    onMutate: async ({ emoji }) => {
      // Cancel outgoing refetches
      await utils.recipe.reactions.getReactions.cancel({ recipeId });

      // Snapshot the previous value
      const previousReactions = utils.recipe.reactions.getReactions.getData({ recipeId });

      // Optimistically update the reaction
      utils.recipe.reactions.getReactions.setData({ recipeId }, (old = []) => {
        const existing = old.find((r) => r.emoji === emoji);
        if (existing) {
          return old.map((r) =>
            r.emoji === emoji
              ? { ...r, hasReacted: !r.hasReacted, count: r.count + (r.hasReacted ? -1 : 1) }
              : r,
          );
        }
        return [...old, { emoji, count: 1, hasReacted: true, timestamp: Date.now() }];
      });

      return { previousReactions };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousReactions) {
        utils.recipe.reactions.getReactions.setData({ recipeId }, context.previousReactions);
      }
      toast.error("Failed to update reaction");
    },
    onSettled: () => {
      // Refetch after error or success
      void utils.recipe.reactions.getReactions.invalidate({ recipeId });
    },
  });

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      toggleReaction.mutate({ recipeId, emoji });
    },
    [recipeId, toggleReaction],
  );

  const handleAddReaction = useCallback(
    (emoji: string) => {
      const existing = reactions.find((r) => r.emoji === emoji);
      if (!existing?.hasReacted) {
        toggleReaction.mutate({ recipeId, emoji });
      }
    },
    [recipeId, reactions, toggleReaction],
  );

  const sortedReactions = useMemo(() => {
    // If there are no reactions with count > 0, show default thumbs up with count 0
    const hasAnyReactions = reactions.some((r) => r.count > 0);

    if (!hasAnyReactions) {
      return [
        {
          emoji: THUMBS_UP_REACTION.emoji,
          count: 0,
          hasReacted: false,
          timestamp: Date.now(),
        },
      ];
    }

    return reactions
      .filter((r) => r.count > 0)
      .sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count;
        return (b.timestamp ?? 0) - (a.timestamp ?? 0);
      });
  }, [reactions]);

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
            aria-label="Add reaction"
          >
            <SmilePlus className="h-4 w-4 aspect-square text-gray-700" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-gray-200">
          <EmojiGrid reactions={AVAILABLE_REACTIONS} onSelect={handleAddReaction} />
        </PopoverContent>
      </Popover>

      <motion.div layout className="flex gap-2">
        <AnimatePresence mode="popLayout">
          {sortedReactions.map(({ emoji, count, hasReacted }) => (
            <EmojiCounter
              key={emoji}
              emoji={emoji}
              label={AVAILABLE_REACTIONS.find((r) => r.emoji === emoji)?.label ?? ""}
              count={count}
              isSelected={hasReacted}
              onClick={() => handleToggleReaction(emoji)}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EmojiReactions;
