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
} from "@dishify/ui/src";
import { Search } from "@dishify/ui/src/icons/search";
import { FavoriteCard } from "./card";
import { EmptyState } from "./empty-state";
import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import type { Option } from "@dishify/ui/src/elements/select";
import type { NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { useRouter } from "solito/navigation";
import { AnimatePresence, MotiView } from "moti";

const createOption = (value: string, label: string): Option => ({ value, label });

const DEFAULT_SORT = createOption("recent", "Most Recent");
const DEFAULT_CUISINE = createOption("all", "All Cuisines");
const DEFAULT_DIFFICULTY = createOption("all", "All Difficulties");

export function FavoritesScreen() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<Option>(DEFAULT_SORT);
  const [cuisineFilter, setCuisineFilter] = useState<Option>(DEFAULT_CUISINE);
  const [difficultyFilter, setDifficultyFilter] = useState<Option>(DEFAULT_DIFFICULTY);

  const { data: favorites = [], isLoading } = trpc.recipe.favorites.getFavorites.useQuery();

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

  if (favorites.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <View className="w-full space-y-6">
      <View className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <View className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <TextInput
            placeholder="Search favorites..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </View>

        <Select value={sortBy} onValueChange={setSortBy} className="w-[150px]">
          <SelectTrigger>Sort by</SelectTrigger>
          <SelectContent>
            <SelectItem value="recent" label="Most Recent">
              Most Recent
            </SelectItem>
            <SelectItem value="popular" label="Most Popular">
              Most Popular
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={cuisineFilter} onValueChange={setCuisineFilter} className="w-[150px]">
          <SelectTrigger>Cuisine</SelectTrigger>
          <SelectContent>
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

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter} className="w-[150px]">
          <SelectTrigger>Difficulty</SelectTrigger>
          <SelectContent>
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
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "timing", duration: 250 }}
            className="flex items-center justify-center py-12"
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
                    className="w-full"
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
