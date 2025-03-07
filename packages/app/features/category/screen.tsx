"use client";

import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, Text, ActivityIndicator } from "react-native";
import { useInView } from "react-intersection-observer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@dishify/app/utils/trpc";
import type { z } from "zod";
import type { RecipeCategorySchema } from "@dishify/api/schemas/category";
import type { Category } from "@dishify/api/schemas/category";
import { keepPreviousData } from "@tanstack/react-query";
import {
  sortOptions,
  difficultyOptions,
  costOptions,
  timeOptions,
  type SortBy,
  type DifficultyFilter,
  type CostFilter,
  type TimeFilter,
} from "@dishify/app/utils/recipe-filters";
import {
  RecipeCard,
  RecipeCardSkeleton,
  EmptyState,
  TypeSafeSelect,
  CategorySelect,
} from "./components";

// Array of skeleton IDs for loading state
const SKELETON_IDS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`);

interface CategoryScreenProps {
  category: Category;
}

export function CategoryScreen({ category }: CategoryScreenProps) {
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [cost, setCost] = useState<CostFilter>("all");
  const [time, setTime] = useState<TimeFilter>("all");
  const [page, setPage] = useState(1);
  const insets = useSafeAreaInsets();
  const loadMoreRef = useRef<View>(null);
  const { inView } = useInView({
    root: null,
    threshold: 0.1,
  });

  const {
    data: recipes,
    isLoading,
    isError,
    isFetching,
  } = trpc.recipe.getRecipesByCategory.useQuery(
    {
      category: category.name as z.infer<typeof RecipeCategorySchema>,
      sortBy,
      difficulty,
      cost,
      time,
      page,
      limit: 12,
    },
    {
      // Keep previous data while fetching new data
      placeholderData: keepPreviousData,
      // Only refetch when filters change, not on window focus
      refetchOnWindowFocus: false,
    },
  );

  const { data: totalCount } = trpc.recipe.getRecipesByCategoryCount.useQuery(
    {
      category: category.name as z.infer<typeof RecipeCategorySchema>,
      difficulty,
      cost,
      time,
    },
    {
      // Keep previous data while fetching new data
      placeholderData: keepPreviousData,
    },
  );

  useEffect(() => {
    if (inView && recipes && recipes.length < (totalCount ?? 0)) {
      setPage((p) => p + 1);
    }
  }, [inView, recipes, totalCount]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, []); // We only need to reset the page when the component mounts

  // Render content based on query status
  const renderContent = () => {
    if (isError) {
      return (
        <View className="flex-1 items-center justify-center py-8">
          <Text>Something went wrong. Please try again.</Text>
        </View>
      );
    }

    if (isLoading && !recipes) {
      return (
        <View className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {SKELETON_IDS.map((id) => (
            <RecipeCardSkeleton key={id} />
          ))}
        </View>
      );
    }

    if (recipes && recipes.length > 0) {
      return (
        <>
          <View className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
          {recipes.length < (totalCount ?? 0) && (
            <View ref={loadMoreRef} className="h-20 items-center justify-center">
              {isFetching && page > 1 && <ActivityIndicator size="small" />}
            </View>
          )}
        </>
      );
    }

    // Empty state
    return (
      <View className="py-6">
        <EmptyState />
      </View>
    );
  };

  // Render the main screen layout with filters always visible
  return (
    <View className="flex-1 pt-12">
      {/* Filters section - always rendered */}
      <View className="flex-row flex-wrap justify-center sm:justify-start gap-2 px-4 py-2">
        <CategorySelect currentCategory={category} />

        <TypeSafeSelect<SortBy>
          value={sortBy}
          onValueChange={setSortBy}
          options={sortOptions}
          placeholder="Sort by"
        />

        <TypeSafeSelect<DifficultyFilter>
          value={difficulty}
          onValueChange={setDifficulty}
          options={difficultyOptions}
          placeholder="Difficulty"
        />

        <TypeSafeSelect<CostFilter>
          value={cost}
          onValueChange={setCost}
          options={costOptions}
          placeholder="Cost"
        />

        <TypeSafeSelect<TimeFilter>
          value={time}
          onValueChange={setTime}
          options={timeOptions}
          placeholder="Time"
        />

        {/* Show loading indicator next to filters when fetching but not on initial load */}
        {isFetching && !isLoading && (
          <View className="flex items-center justify-center ml-2">
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>

      {/* Content section - conditionally rendered based on query status */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}
