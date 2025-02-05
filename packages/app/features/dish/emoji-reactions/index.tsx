import { useState, useCallback, useMemo } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@dishify/ui";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "app/utils/trpc";
import { toast } from "app/utils/toast";
import { useAtom } from "jotai";
import { useOnline } from "app/utils/hooks/use-online";
import { useOfflineSync } from "app/utils/hooks/use-offline-sync";
import { recipeReactionsAtom, type ReactionState, type RecipeReactions } from "app/atoms/reactions";
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
  const isOnline = useOnline();
  const [localReactions, setLocalReactions] = useAtom(recipeReactionsAtom);

  // Get reactions for this recipe from local storage or initialize empty
  const currentRecipeReactions = localReactions[recipeId] || [];

  // Toggle reaction mutation
  const toggleReaction = trpc.recipe.reactions.toggleReaction.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update reaction");
    },
  });

  // Setup offline sync
  useOfflineSync<RecipeReactions, { recipeId: string; emoji: string }>(
    recipeReactionsAtom,
    (payload) => {
      toggleReaction.mutate(payload);
    },
    {
      versionCheck: true,
      onError: (err) => toast.error(err.message),
      getSyncPayload: (data) => {
        const reactions = data[recipeId] || [];
        // We only sync reactions that the user has reacted to
        const reacted = reactions.find((r) => r.hasReacted);
        return reacted
          ? {
              recipeId,
              emoji: reacted.emoji,
            }
          : { recipeId, emoji: "" };
      },
    },
  );

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      setLocalReactions((prev) => {
        const recipeReactions = prev[recipeId] || [];
        const existing = recipeReactions.find((r) => r.emoji === emoji);

        let updatedReactions: ReactionState[];
        if (existing) {
          // Toggle existing reaction
          updatedReactions = recipeReactions.map((r) =>
            r.emoji === emoji
              ? { ...r, hasReacted: !r.hasReacted, count: r.count + (r.hasReacted ? -1 : 1) }
              : r,
          );
        } else {
          // Add new reaction
          updatedReactions = [
            ...recipeReactions,
            { emoji, count: 1, hasReacted: true, timestamp: Date.now() },
          ];
        }

        return {
          ...prev,
          [recipeId]: updatedReactions,
        };
      });

      if (!isOnline) {
        toast.info("Changes will sync when you're back online");
      }
    },
    [recipeId, setLocalReactions, isOnline],
  );

  const handleAddReaction = useCallback(
    (emoji: string) => {
      const existing = currentRecipeReactions.find((r) => r.emoji === emoji);
      if (!existing?.hasReacted) {
        handleToggleReaction(emoji);
      }
    },
    [currentRecipeReactions, handleToggleReaction],
  );

  const sortedReactions = useMemo(() => {
    // If there are no reactions with count > 0, show default thumbs up with count 0
    const hasAnyReactions = currentRecipeReactions.some((r) => r.count > 0);

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

    return currentRecipeReactions
      .filter((r) => r.count > 0)
      .sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count;
        return (b.timestamp ?? 0) - (a.timestamp ?? 0);
      });
  }, [currentRecipeReactions]);

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
