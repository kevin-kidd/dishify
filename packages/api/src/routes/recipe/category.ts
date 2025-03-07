import { z } from "zod";
import { RecipeCategorySchema } from "../../../schemas/category";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { and, sql, desc, type SQL } from "drizzle-orm";
import { costMap, timeMap } from "@dishify/app/utils/recipe-filters";
import { publicProcedure } from "../../trpc";
import { tryCatch } from "@dishify/app/utils/helpers";

export const getRecipesByCategory = publicProcedure
  .input(
    z.object({
      category: RecipeCategorySchema,
      sortBy: z.enum(["recent", "popular", "rating", "name"]).default("recent"),
      difficulty: z.enum(["all", "Easy", "Medium", "Hard"]).optional(),
      cost: z.enum(["all", "budget", "moderate", "premium"]).optional(),
      time: z.enum(["all", "quick", "moderate", "long"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(12),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { category, sortBy, difficulty, cost, time, page, limit } = input;
    const offset = (page - 1) * limit;

    // Build conditions array for filtering
    const filters: SQL<unknown>[] = [];

    // Handle category filtering
    if (category === "Other") {
      // For "Other" category, include recipes with null category or "Other" category
      filters.push(
        sql`(${EnglishRecipesTable.category} IS NULL OR LOWER(${EnglishRecipesTable.category}) = LOWER(${category}))`,
      );
    } else {
      // For all other categories, use case-insensitive comparison
      filters.push(sql`LOWER(${EnglishRecipesTable.category}) = LOWER(${category})`);
    }

    if (difficulty && difficulty !== "all") {
      filters.push(sql`${EnglishRecipesTable.data}->>'difficulty' = ${difficulty}`);
    }

    if (cost && cost !== "all") {
      const { min, max } = costMap[cost as keyof typeof costMap];
      filters.push(
        sql`CAST(${EnglishRecipesTable.estimatedCosts}->>'cost' AS INTEGER) BETWEEN ${min} AND ${max}`,
      );
    }

    if (time && time !== "all") {
      const { min, max } = timeMap[time as keyof typeof timeMap];
      filters.push(
        sql`CAST(REPLACE(REPLACE(${EnglishRecipesTable.data}->>'cookingTime', ' minutes', ''), ' minute', '') AS INTEGER) BETWEEN ${min} AND ${max}`,
      );
    }

    // Build the query in one go to avoid type issues
    const query = ctx.db
      .select()
      .from(EnglishRecipesTable)
      .where(and(...filters))
      .orderBy(
        sortBy === "popular"
          ? desc(sql`${EnglishRecipesTable.ratings}->>'count'`)
          : sortBy === "rating"
            ? desc(sql`${EnglishRecipesTable.ratings}->>'average'`)
            : sortBy === "name"
              ? EnglishRecipesTable.name
              : desc(EnglishRecipesTable.createdAt),
      )
      .limit(limit)
      .offset(offset);

    const { data: recipes, error } = await tryCatch(query.all());

    if (error) {
      console.error("Failed to fetch recipes by category:", error);
      return [];
    }

    return recipes;
  });

export const getRecipesByCategoryCount = publicProcedure
  .input(
    z.object({
      category: RecipeCategorySchema,
      difficulty: z.enum(["all", "Easy", "Medium", "Hard"]).optional(),
      cost: z.enum(["all", "budget", "moderate", "premium"]).optional(),
      time: z.enum(["all", "quick", "moderate", "long"]).optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { category, difficulty, cost, time } = input;

    // Build conditions array for filtering
    const filters: SQL<unknown>[] = [];

    // Handle category filtering
    if (category === "Other") {
      // For "Other" category, include recipes with null category or "Other" category
      filters.push(
        sql`(${EnglishRecipesTable.category} IS NULL OR LOWER(${EnglishRecipesTable.category}) = LOWER(${category}))`,
      );
    } else {
      // For all other categories, use case-insensitive comparison
      filters.push(sql`LOWER(${EnglishRecipesTable.category}) = LOWER(${category})`);
    }

    if (difficulty && difficulty !== "all") {
      filters.push(sql`${EnglishRecipesTable.data}->>'difficulty' = ${difficulty}`);
    }

    if (cost && cost !== "all") {
      const { min, max } = costMap[cost as keyof typeof costMap];
      filters.push(
        sql`CAST(${EnglishRecipesTable.estimatedCosts}->>'cost' AS INTEGER) BETWEEN ${min} AND ${max}`,
      );
    }

    if (time && time !== "all") {
      const { min, max } = timeMap[time as keyof typeof timeMap];
      filters.push(
        sql`CAST(REPLACE(REPLACE(${EnglishRecipesTable.data}->>'cookingTime', ' minutes', ''), ' minute', '') AS INTEGER) BETWEEN ${min} AND ${max}`,
      );
    }

    // Log the category being counted
    console.log("Counting recipes with category:", {
      category,
      categoryType: typeof category,
    });

    const query = ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(EnglishRecipesTable)
      .where(and(...filters));

    const { data: result, error } = await tryCatch(query.get());

    if (error) {
      console.error("Failed to fetch recipe count by category:", error);
      return 0;
    }

    // Log the count result
    console.log(`Found ${result?.count ?? 0} recipes for category "${category}"`);

    return result?.count ?? 0;
  });
