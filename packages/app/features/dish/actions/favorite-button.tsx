import { useCallback } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@dishify/ui";
import { trpc } from "app/utils/trpc";
import { useAtom } from "jotai";
import { useOnline } from "app/utils/hooks/use-online";
import { toast } from "app/utils/toast";
import { favoritedRecipesAtom } from "app/atoms/favorites";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";
import { useOfflineSync } from "app/utils/hooks/use-offline-sync";

interface FavoriteButtonProps {
  recipe: EnglishRecipe;
  className?: string;
  onPress?: () => Promise<void>;
}

export function FavoriteButton({ recipe, className, onPress }: FavoriteButtonProps) {
  const isOnline = useOnline();
  const [favoritedRecipes, setFavoritedRecipes] = useAtom(favoritedRecipesAtom);
  const isFavorited = !!favoritedRecipes[recipe.id];

  const mutation = trpc.recipe.toggleFavorite.useMutation({
    onError: (error) => {
      toast.error(error.message || "Failed to update favorites");
    },
  });

  useOfflineSync<Record<string, EnglishRecipe>, { recipes: (typeof recipe)[] }>(
    favoritedRecipesAtom,
    (payload) => {
      for (const r of payload.recipes) {
        mutation.mutate({ recipeId: r.id, recipe: r });
      }
    },
    {
      versionCheck: true,
      onError: (err) => toast.error(err.message),
      getSyncPayload: (data) => {
        const allRecipes = Object.values(data);
        return { recipes: allRecipes };
      },
    },
  );

  const handleToggleFavorite = useCallback(async () => {
    if (onPress) {
      await onPress();
    }
    setFavoritedRecipes((prev) => {
      const next = { ...prev };
      if (isFavorited) {
        delete next[recipe.id];
      } else {
        next[recipe.id] = recipe;
      }
      return next;
    });

    if (!isOnline) {
      toast.info("Changes will sync when you're back online");
    }
  }, [isOnline, recipe, setFavoritedRecipes, isFavorited, onPress]);

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
