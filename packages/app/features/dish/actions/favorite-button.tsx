import { useCallback } from "react";
import { Star } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, Button, cn, Span } from "@dishify/ui";
import { trpc } from "app/utils/trpc";
import { useAtom } from "jotai";
import { useOnline } from "app/utils/hooks/use-online";
import { toast } from "app/utils/toast";
import { favoritedRecipesAtom } from "app/atoms/favorites";
import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";
import { useOfflineSync } from "app/utils/hooks/use-offline-sync";
import { authClient } from "app/utils/auth/client";

interface FavoriteButtonProps {
  recipe: EnglishRecipe;
  className?: string;
  onClick?: () => Promise<void>;
}

export function FavoriteButton({ recipe, className, onClick }: FavoriteButtonProps) {
  const isOnline = useOnline();
  const [favoritedRecipes, setFavoritedRecipes] = useAtom(favoritedRecipesAtom);
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user?.id;
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
      getSyncPayload: (data) => {
        const allRecipes = Object.values(data);
        return { recipes: allRecipes };
      },
    },
  );

  const handleToggleFavorite = useCallback(async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to favorite recipes");
      return;
    }

    if (onClick) {
      await onClick();
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
  }, [isOnline, recipe, setFavoritedRecipes, isFavorited, onClick, isSignedIn]);

  const isLoading = mutation.isPending;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="none"
          className={cn(
            "hidden md:flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all duration-200",
            !isSignedIn && "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100",
            className,
          )}
          onClick={handleToggleFavorite}
          disabled={isLoading || !isSignedIn}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors duration-200",
              isFavorited ? "fill-yellow-500 text-yellow-500" : "text-gray-500",
            )}
            strokeWidth={2}
          />
          <Span className="sr-only">
            {isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          </Span>
        </Button>
      </TooltipTrigger>
      <TooltipContent position="top">
        {!isSignedIn
          ? "Sign in to favorite recipes"
          : isFavorited
            ? "Remove from Favorites"
            : "Add to Favorites"}
      </TooltipContent>
    </Tooltip>
  );
}
