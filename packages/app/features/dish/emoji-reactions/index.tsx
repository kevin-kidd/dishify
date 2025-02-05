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
  const isOnline = useOnline();
  const [localReactions, setLocalReactions] = useAtom(recipeReactionsAtom);
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user?.id;

  // Get reactions for this recipe from local storage or initialize empty
  const currentRecipeReactions = localReactions[slug] || [];

  // Toggle reaction mutation
  const toggleReaction = trpc.recipe.reactions.toggleReaction.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update reaction");
    },
  });

  // Setup offline sync
  useOfflineSync<RecipeReactions, { slug: string; emoji: string }>(
    recipeReactionsAtom,
    (payload) => {
      toggleReaction.mutate(payload);
    },
    {
      versionCheck: true,
      getSyncPayload: (data) => {
        const reactions = data[slug] || [];
        // We only sync reactions that the user has reacted to
        const reacted = reactions.find((r) => r.hasReacted);
        return reacted
          ? {
              slug,
              emoji: reacted.emoji,
            }
          : { slug, emoji: "" };
      },
    },
  );

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      if (!isSignedIn) {
        toast.error("Please sign in to react to recipes");
        return;
      }

      setLocalReactions((prev) => {
        const recipeReactions = prev[slug] || [];
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
          [slug]: updatedReactions,
        };
      });

      if (!isOnline) {
        toast.info("Changes will sync when you're back online");
      }
    },
    [slug, setLocalReactions, isOnline, isSignedIn],
  );

  const handleAddReaction = useCallback(
    (emoji: string) => {
      if (!isSignedIn) {
        toast.error("Please sign in to react to recipes");
        return;
      }

      const existing = currentRecipeReactions.find((r) => r.emoji === emoji);
      if (!existing?.hasReacted) {
        handleToggleReaction(emoji);
      }
    },
    [currentRecipeReactions, handleToggleReaction, isSignedIn],
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
