import { useCallback } from "react";
import { Star } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, Button, cn, Span } from "@dishify/ui";
import { trpc } from "app/utils/trpc";
import { toast } from "app/utils/toast";

import type { EnglishRecipe } from "@dishify/api/src/db/schema/recipes";

import { authClient } from "app/utils/auth/client";

interface FavoriteButtonProps {
  recipe: EnglishRecipe;
  className?: string;
  onClick?: () => Promise<void>;
}

export function FavoriteButton({ recipe, className, onClick }: FavoriteButtonProps) {
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user?.id;
  const utils = trpc.useUtils();
  const { data: isFavorited } = trpc.recipe.favorites.isFavorited.useQuery(
    { id: recipe.id },
    { meta: { skipErrorToast: true, enabled: isSignedIn } },
  );

  const mutation = trpc.recipe.favorites.toggleFavorite.useMutation({
    onMutate: async ({ recipeId }) => {
      // Cancel any outgoing refetches
      await utils.recipe.favorites.isFavorited.cancel({ id: recipeId });

      // Snapshot the previous value
      const previousValue = utils.recipe.favorites.isFavorited.getData({ id: recipeId });

      // Optimistically update to the new value
      utils.recipe.favorites.isFavorited.setData({ id: recipeId }, !previousValue);

      // Return a context object with the snapshotted value
      return { previousValue };
    },
    onError: (error, variables, context) => {
      console.error(error);
      toast.error(error.message || "Failed to update favorite status");

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousValue !== undefined) {
        utils.recipe.favorites.isFavorited.setData(
          { id: variables.recipeId },
          context.previousValue,
        );
      }
    },
    onSettled: (_, __, { recipeId }) => {
      // Sync with server after mutation completes
      utils.recipe.favorites.isFavorited.invalidate({ id: recipeId });
    },
  });

  const handleToggleFavorite = useCallback(async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to favorite recipes");
      return;
    }

    if (onClick) {
      await onClick();
    }

    mutation.mutate({ recipeId: recipe.id, recipe });
  }, [recipe, onClick, isSignedIn, mutation]);

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
          onPress={handleToggleFavorite}
          disabled={mutation.isPending || !isSignedIn}
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
