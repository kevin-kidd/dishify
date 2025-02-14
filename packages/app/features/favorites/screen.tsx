"use client";

import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { trpc } from "app/utils/trpc";
import {
  TextInput,
  Select,
  SelectItem,
  Text,
  SelectTrigger,
  SelectContent,
  Skeleton,
  Button,
  SelectValue,
} from "@dishify/ui/src";
import { Search } from "@dishify/ui/src/icons/search";
import { FavoriteCard } from "./card";
import { EmptyState } from "./empty-state";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import type { Option } from "@dishify/ui/src/elements/select";
import type { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { useRouter } from "solito/navigation";
import { useAuth } from "app/utils/hooks/use-auth";
import { skipToken } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_SORT = { value: "recent", label: "Most Recent" };
const DEFAULT_CUISINE = { value: "all", label: "All Cuisines" };
const DEFAULT_DIFFICULTY = { value: "all", label: "All Difficulties" };

export function FavoritesScreen() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Option>(DEFAULT_SORT);
  const [cuisineFilter, setCuisineFilter] = useState<Option>(DEFAULT_CUISINE);
  const [difficultyFilter, setDifficultyFilter] = useState<Option>(DEFAULT_DIFFICULTY);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const { data: favorites = [], isLoading } = trpc.recipe.favorites.getFavorites.useQuery(
    !isSignedIn ? skipToken : undefined,
  );

  const filteredFavorites = useMemo(() => {
    if (!sortBy || !cuisineFilter || !difficultyFilter) return [];

    return favorites
      .filter((fav) => {
        if (!fav.recipeData?.data) return false;
        const recipe = fav.recipeData.data;
        const matchesSearch = search
          ? recipe.dishName.toLowerCase().startsWith(search.toLowerCase())
          : true;
        const matchesCuisine =
          cuisineFilter.value === "all" || recipe.cuisine === cuisineFilter.value;
        const matchesDifficulty =
          difficultyFilter.value === "all" || recipe.difficulty === difficultyFilter.value;
        return matchesSearch && matchesCuisine && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy.value === "recent") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // For "popular" sorting, we could add a popularity metric later
        return 0;
      });
  }, [favorites, search, sortBy, cuisineFilter, difficultyFilter]);

  const uniqueCuisines = useMemo(() => {
    const cuisines = new Set(
      favorites
        .map((fav) => fav.recipeData?.data?.cuisine)
        .filter((cuisine): cuisine is RecipeResponse["cuisine"] => !!cuisine),
    );
    return Array.from(cuisines);
  }, [favorites]);

  const handleSearchChange = useCallback(
    (e: NativeSyntheticEvent<TextInputChangeEventData> | string) => {
      if (typeof e === "string") {
        setSearch(e);
      } else {
        setSearch(e.nativeEvent.text);
      }
    },
    [],
  );

  if (isSignedIn === "signed-out") {
    router.push("/account/sign-in");
    return null;
  }

  if (favorites.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <View className="w-full space-y-6 py-12 sm:container mx-auto">
      <Text className="text-3xl font-bold tracking-tight">Your Favorites</Text>
      <View className="flex flex-col items-start gap-3 justify-center">
        <View className="relative flex w-full">
          <Search className="absolute left-3 top-3 transform h-4 w-4 text-muted-foreground" />
          <TextInput
            placeholder="Search favorites..."
            value={search}
            onChange={handleSearchChange}
            className="sm:pl-9 pl-9"
          />
        </View>
        <View className="grid grid-cols-3 gap-3 max-w-[425px] w-full">
          <Select value={sortBy} onValueChange={setSortBy} className="w-full">
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent insets={contentInsets}>
              <SelectItem value="recent" label="Most Recent">
                Most Recent
              </SelectItem>
              <SelectItem value="popular" label="Most Popular">
                Most Popular
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={cuisineFilter} onValueChange={setCuisineFilter} className="w-full">
            <SelectTrigger>
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent insets={contentInsets}>
              <SelectItem value="all" label="All Cuisines">
                All Cuisines
              </SelectItem>
              {uniqueCuisines.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine} label={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter} className="w-full">
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent insets={contentInsets}>
              <SelectItem value="all" label="All Difficulties">
                All Difficulties
              </SelectItem>
              <SelectItem value="Easy" label="Easy">
                Easy
              </SelectItem>
              <SelectItem value="Medium" label="Medium">
                Medium
              </SelectItem>
              <SelectItem value="Hard" label="Hard">
                Hard
              </SelectItem>
            </SelectContent>
          </Select>
        </View>
      </View>

      <AnimatePresence>
        {isLoading ? (
          <View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            <Skeleton className="w-full h-52" />
            <Skeleton className="w-full h-52" />
            <Skeleton className="w-full h-52" />
          </View>
        ) : filteredFavorites.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "timing", duration: 250 }}
            style={{
              $$css: true,
              className: "flex items-center justify-center py-12",
            }}
          >
            <Text className="text-muted-foreground">No favorites match your filters</Text>
          </MotiView>
        ) : (
          <View className="flex justify-center">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 250 }}
              style={{
                $$css: true,
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
              }}
            >
              {filteredFavorites.map((favorite) => {
                if (!favorite.recipeData) return null;
                const { data, slug, status, id } = favorite.recipeData;
                if (!data) return null;

                return (
                  <MotiView
                    key={favorite.recipeId}
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "timing", duration: 250 }}
                  >
                    <FavoriteCard
                      recipe={{
                        ...data,
                        id,
                        slug,
                        status,
                      }}
                    />
                  </MotiView>
                );
              })}
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </View>
  );
}
