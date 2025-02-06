import { useState, useCallback, useMemo } from "react";
import { View, Pressable } from "react-native";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@dishify/ui";
import { MotiView, AnimatePresence } from "moti";
import { trpc } from "app/utils/trpc";
import { toast } from "app/utils/toast";
import { useAtom } from "jotai";
import { useOnline } from "app/utils/hooks/use-online";
import { useOfflineSync } from "app/utils/hooks/use-offline-sync";
import { recipeReactionsAtom, type ReactionState, type RecipeReactions } from "app/atoms/reactions";
import { authClient } from "app/utils/auth/client";
import EmojiGrid from "./grid";
import EmojiCounter from "./counter";
import { cn } from "@dishify/ui";

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
  slug: string;
}

export const EmojiReactions = ({ slug }: EmojiReactionsProps) => {
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user?.id;

  const utils = trpc.useUtils();
  const { data: recipe } = trpc.recipe.getRecipeBySlug.useQuery({ slug });
  const { data: reactions } = trpc.recipe.reactions.getReactions.useQuery({ slug });

  // Toggle reaction mutation
  const toggleReaction = trpc.recipe.reactions.toggleReaction.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update reaction");
    },
    onMutate: async ({ emoji }) => {
      // Cancel any outgoing refetches
      await utils.recipe.reactions.getReactions.cancel({ slug });

      // Snapshot the previous value
      const previousReactions = utils.recipe.reactions.getReactions.getData({ slug });

      // Optimistically update the reactions
      utils.recipe.reactions.getReactions.setData({ slug }, (old) => {
        if (!old) return old;

        const updatedReactions = { ...old };

        // If reaction doesn't exist yet, initialize it
        if (!updatedReactions[emoji]) {
          updatedReactions[emoji] = {
            count: 0,
            hasReacted: false,
          };
        }

        // Toggle the reaction
        if (updatedReactions[emoji].hasReacted) {
          updatedReactions[emoji].count = Math.max(0, updatedReactions[emoji].count - 1);
          updatedReactions[emoji].hasReacted = false;
        } else {
          updatedReactions[emoji].count++;
          updatedReactions[emoji].hasReacted = true;
        }

        return updatedReactions;
      });

      // Return a context object with the snapshotted value
      return { previousReactions };
    },
    onSettled: () => {
      // Sync with server after mutation completes
      utils.recipe.reactions.getReactions.invalidate({ slug });
    },
  });

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      if (!isSignedIn) {
        toast.error("Please sign in to react to recipes");
        return;
      }

      if (!recipe?.id) {
        toast.error("Recipe not found");
        return;
      }

      toggleReaction.mutate({ slug, emoji });
    },
    [slug, recipe?.id, isSignedIn, toggleReaction.mutate],
  );

  const handleAddReaction = useCallback(
    (emoji: string) => {
      if (!isSignedIn) {
        toast.error("Please sign in to react to recipes");
        return;
      }

      handleToggleReaction(emoji);
    },
    [handleToggleReaction, isSignedIn],
  );

  const sortedReactions = useMemo(() => {
    // If there are no reactions with count > 0, show default thumbs up with count 0
    const hasAnyReactions = Object.values(reactions ?? {}).some((r) => r.count > 0);

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

    return Object.entries(reactions ?? {})
      .filter(([_, data]) => data.count > 0)
      .map(([emoji, data]) => ({
        emoji,
        count: data.count,
        hasReacted: data.hasReacted,
      }));
  }, [reactions]);

  return (
    <View className="flex flex-row items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Pressable
            className={cn(
              "p-2 rounded-full bg-gray-100 active:bg-gray-200 transition-all border border-gray-200 hover:bg-gray-200 hover:scale-105 active:scale-95 duration-200",
              !isSignedIn && "cursor-not-allowed opacity-50",
            )}
            accessibilityLabel="Add reaction"
          >
            <MotiView
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              from={{ scale: 0.95 }}
            >
              <SmilePlus className="h-4 w-4 aspect-square text-gray-700" />
            </MotiView>
          </Pressable>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-gray-200">
          <EmojiGrid
            reactions={AVAILABLE_REACTIONS}
            onSelect={handleAddReaction}
            isSignedIn={isSignedIn}
          />
        </PopoverContent>
      </Popover>

      <MotiView
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 150 }}
        style={{ flexDirection: "row", gap: 8 }}
      >
        <AnimatePresence>
          {sortedReactions.map(({ emoji, count, hasReacted }) => (
            <EmojiCounter
              key={emoji}
              emoji={emoji}
              label={AVAILABLE_REACTIONS.find((r) => r.emoji === emoji)?.label ?? ""}
              count={count}
              isSelected={hasReacted}
              onClick={() => handleToggleReaction(emoji)}
              isSignedIn={isSignedIn}
            />
          ))}
        </AnimatePresence>
      </MotiView>
    </View>
  );
};

export default EmojiReactions;
