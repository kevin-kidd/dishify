import { useCallback, useEffect } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@dishify/ui";
import { trpc } from "app/utils/trpc";
import { useAtom } from "jotai";
import { useOnline } from "app/utils/hooks/use-online";
import { toast } from "app/utils/toast";
import { favoritedRecipesAtom } from "app/atoms/favorites";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";

// Debounce function to prevent rapid API calls
const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

interface FavoriteButtonProps {
  recipe: EnglishRecipe;
  className?: string;
  onPress?: () => Promise<void>;
}

export function FavoriteButton({ recipe, className, onPress }: FavoriteButtonProps) {
  const isOnline = useOnline();
  const [favoritedRecipes, setFavoritedRecipes] = useAtom(favoritedRecipesAtom);

  const isFavorited = !!favoritedRecipes[recipe.id];

  // tRPC mutation for syncing with database
  const mutation = trpc.recipe.toggleFavorite.useMutation({
    onSuccess: (data) => {
      if (data.favorited) {
        setFavoritedRecipes((prev) => ({
          ...prev,
          [recipe.id]: recipe,
        }));
        toast.success("Added to favorites");
      } else {
        setFavoritedRecipes((prev) => {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        });
        toast.success("Removed from favorites");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update favorites");
      // Revert optimistic update
      setFavoritedRecipes((prev) => {
        if (isFavorited) {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        }
        return {
          ...prev,
          [recipe.id]: recipe,
        };
      });
    },
  });

  // Debounced sync function
  const debouncedSync = useCallback(
    debounce((favorites: Record<string, EnglishRecipe>, mutate: typeof mutation.mutate) => {
      if (!isOnline) return;

      for (const [id, recipe] of Object.entries(favorites)) {
        mutate({ recipeId: id, recipe });
      }
    }, 1000),
    [], // No dependencies needed as we pass them as arguments
  );

  // Sync with database when online
  useEffect(() => {
    if (isOnline) {
      debouncedSync(favoritedRecipes, mutation.mutate);
    }
  }, [debouncedSync, favoritedRecipes, isOnline, mutation.mutate]);

  const handleToggleFavorite = useCallback(async () => {
    if (onPress) {
      await onPress();
    }

    if (isOnline) {
      // Optimistic update
      setFavoritedRecipes((prev) => {
        if (prev[recipe.id]) {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        }
        return {
          ...prev,
          [recipe.id]: recipe,
        };
      });
      mutation.mutate({ recipeId: recipe.id, recipe });
    } else {
      setFavoritedRecipes((prev) => {
        if (prev[recipe.id]) {
          const next = { ...prev };
          delete next[recipe.id];
          return next;
        }
        return {
          ...prev,
          [recipe.id]: recipe,
        };
      });
      toast.info("Changes will sync when you're back online");
    }
  }, [isOnline, recipe, setFavoritedRecipes, mutation.mutate, onPress]);

  const isLoading = mutation.isPending;

  return (
    <Tooltip>
      <TooltipTrigger>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`hidden md:flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          onClick={handleToggleFavorite}
          disabled={isLoading}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isFavorited ? [1, 1.2, 1] : 1,
              color: isFavorited ? "#FFD700" : "#4B5563",
              opacity: isLoading ? 0.5 : 1,
            }}
            transition={{
              duration: 0.3,
              scale: {
                type: "spring",
                stiffness: 300,
                damping: 10,
              },
            }}
          >
            <Star
              className="h-4 w-4"
              fill={isFavorited ? "currentColor" : "none"}
              strokeWidth={2}
            />
          </motion.div>
          <span className="sr-only">
            {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          </span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent position="top">
        {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
      </TooltipContent>
    </Tooltip>
  );
}
