import { createId } from "@paralleldrive/cuid2";
import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import type { RecipeResponse } from "../../../schemas/recipe-response";
import { UserTable } from "./user";
// English recipe name table
export const EnglishRecipeNameTable = sqliteTable(
  "english_recipes",
  {
    id: text("id")
      .unique()
      .notNull()
      .$defaultFn(() => createId()),
    name: text("name").primaryKey().notNull(),
  },
  (table) => [uniqueIndex("english_name_idx").on(table.name)],
);
export const EnglishRecipeNameRelations = relations(EnglishRecipeNameTable, ({ one }) => ({
  recipe: one(EnglishRecipesTable, {
    fields: [EnglishRecipeNameTable.name],
    references: [EnglishRecipesTable.name],
  }),
}));

type Rating = {
  count: number;
  emoji: string;
};

// Type for estimated costs by region
export type EstimatedCosts = {
  [region: string]: {
    cost: number; // Cost in cents
    updatedAt: string; // ISO string
    missingIngredientsCount: number;
    totalIngredientsCount: number;
  };
};

// Recipes table
export const EnglishRecipesTable = sqliteTable(
  "english_recipe_details",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    data: text("data", { mode: "json" }).$type<RecipeResponse>(),
    status: text("status", { enum: ["generating", "completed", "error", "moved"] })
      .notNull()
      .default("generating"),
    movedToRecipeId: text("moved_to_recipe_id"),
    movedToSlug: text("moved_to_slug"),
    errorMessage: text("error_message"),
    searchQuery: text("search_query"),
    imageQuery: text("image_query", { enum: ["true", "false"] }),
    imageUrl: text("image_url"),
    description: text("description"),
    category: text("category", {
      enum: [
        "Low Carb",
        "Vegetarian",
        "Vegan",
        "Gluten Free",
        "Dairy Free",
        "Quick & Easy",
        "One Pot",
        "Budget Friendly",
        "High Protein",
        "Keto",
        "Paleo",
        "Mediterranean",
        "Kid Friendly",
        "Healthy",
        "Comfort Food",
        "Other",
      ],
    }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    ratings: text("ratings", { mode: "json" }).$type<Rating[]>(),
    estimatedCosts: text("estimated_costs", { mode: "json" }).$type<EstimatedCosts>(),
  },
  (table) => [
    uniqueIndex("english_recipe_name_idx").on(table.name),
    uniqueIndex("english_recipe_slug_idx").on(table.slug),
  ],
);

// One to one relationship between recipe and recipe name
export const EnglishRecipesTableRelations = relations(EnglishRecipesTable, ({ one }) => ({
  name: one(EnglishRecipeNameTable, {
    fields: [EnglishRecipesTable.id],
    references: [EnglishRecipeNameTable.id],
  }),
}));

export type EnglishRecipe = InferSelectModel<typeof EnglishRecipesTable>;
export const insertEnglishRecipeSchema = createInsertSchema(EnglishRecipesTable);
export const selectEnglishRecipeSchema = createSelectSchema(EnglishRecipesTable);

export type EnglishRecipeName = InferSelectModel<typeof EnglishRecipeNameTable>;
export type InsertEnglishRecipeName = InferInsertModel<typeof EnglishRecipeNameTable>;
export const insertEnglishRecipeNameSchema = createInsertSchema(EnglishRecipeNameTable);
export const selectEnglishRecipeNameSchema = createSelectSchema(EnglishRecipeNameTable);

// Spanish recipe name table
export const SpanishRecipeNameTable = sqliteTable(
  "spanish_recipes",
  {
    id: text("id")
      .unique()
      .notNull()
      .$defaultFn(() => createId()),
    name: text("name").primaryKey().notNull(),
  },
  (table) => [uniqueIndex("spanish_name_idx").on(table.name)],
);
export type SpanishRecipeName = InferSelectModel<typeof SpanishRecipeNameTable>;
export type InsertSpanishRecipeName = InferInsertModel<typeof SpanishRecipeNameTable>;
export const insertSpanishRecipeNameSchema = createInsertSchema(SpanishRecipeNameTable);
export const selectSpanishRecipeNameSchema = createSelectSchema(SpanishRecipeNameTable);

// German recipe name table
export const GermanRecipeNameTable = sqliteTable(
  "german_recipes",
  {
    id: text("id")
      .unique()
      .notNull()
      .$defaultFn(() => createId()),
    name: text("name").primaryKey().notNull(),
  },
  (table) => [uniqueIndex("german_name_idx").on(table.name)],
);
export type GermanRecipeName = InferSelectModel<typeof GermanRecipeNameTable>;
export type InsertGermanRecipeName = InferInsertModel<typeof GermanRecipeNameTable>;
export const insertGermanRecipeNameSchema = createInsertSchema(GermanRecipeNameTable);
export const selectGermanRecipeNameSchema = createSelectSchema(GermanRecipeNameTable);

// French recipe name table
export const FrenchRecipeNameTable = sqliteTable(
  "french_recipes",
  {
    id: text("id")
      .unique()
      .notNull()
      .$defaultFn(() => createId()),
    name: text("name").primaryKey().notNull(),
  },
  (table) => [uniqueIndex("french_name_idx").on(table.name)],
);
export type FrenchRecipeName = InferSelectModel<typeof FrenchRecipeNameTable>;
export type InsertFrenchRecipeName = InferInsertModel<typeof FrenchRecipeNameTable>;
export const insertFrenchRecipeNameSchema = createInsertSchema(FrenchRecipeNameTable);
export const selectFrenchRecipeNameSchema = createSelectSchema(FrenchRecipeNameTable);

// Italian recipe name table
export const ItalianRecipeNameTable = sqliteTable(
  "italian_recipes",
  {
    id: text("id")
      .unique()
      .notNull()
      .$defaultFn(() => createId()),
    name: text("name").primaryKey().notNull(),
  },
  (table) => [uniqueIndex("italian_name_idx").on(table.name)],
);
export type ItalianRecipeName = InferSelectModel<typeof ItalianRecipeNameTable>;
export type InsertItalianRecipeName = InferInsertModel<typeof ItalianRecipeNameTable>;
export const insertItalianRecipeNameSchema = createInsertSchema(ItalianRecipeNameTable);
export const selectItalianRecipeNameSchema = createSelectSchema(ItalianRecipeNameTable);

// Favorites table
export const FavoritesTable = sqliteTable(
  "favorites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => EnglishRecipesTable.id),
    recipeData: text("recipe_data", { mode: "json" }).$type<EnglishRecipe>(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("user_recipe_idx").on(table.userId, table.recipeId)],
);

export const FavoritesTableRelations = relations(FavoritesTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [FavoritesTable.userId],
    references: [UserTable.id],
  }),
  recipe: one(EnglishRecipesTable, {
    fields: [FavoritesTable.recipeId],
    references: [EnglishRecipesTable.id],
  }),
}));

export type Favorite = InferSelectModel<typeof FavoritesTable>;
export type InsertFavorite = InferInsertModel<typeof FavoritesTable>;
export const insertFavoriteSchema = createInsertSchema(FavoritesTable);
export const selectFavoriteSchema = createSelectSchema(FavoritesTable);

// Recipe Reactions table
export const RecipeReactionsTable = sqliteTable(
  "recipe_reactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => EnglishRecipesTable.id),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id),
    emoji: text("emoji").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("user_recipe_emoji_idx").on(table.userId, table.recipeId, table.emoji)],
);

export const RecipeReactionsTableRelations = relations(RecipeReactionsTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [RecipeReactionsTable.userId],
    references: [UserTable.id],
  }),
  recipe: one(EnglishRecipesTable, {
    fields: [RecipeReactionsTable.recipeId],
    references: [EnglishRecipesTable.id],
  }),
}));

export type RecipeReaction = InferSelectModel<typeof RecipeReactionsTable>;
export type InsertRecipeReaction = InferInsertModel<typeof RecipeReactionsTable>;
export const insertRecipeReactionSchema = createInsertSchema(RecipeReactionsTable);
export const selectRecipeReactionSchema = createSelectSchema(RecipeReactionsTable);

// Featured Recipe table
export const FeaturedRecipeTable = sqliteTable("featured_recipes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => EnglishRecipesTable.id),
  slug: text("slug").notNull(),
  dishName: text("dish_name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  cuisine: text("cuisine", {
    enum: [
      "British",
      "Mexican",
      "Italian",
      "Japanese",
      "Chinese",
      "Indian",
      "French",
      "Spanish",
      "German",
      "American",
      "Thai",
      "Vietnamese",
      "Brazilian",
      "Moroccan",
      "Turkish",
      "Korean",
      "Russian",
      "Greek",
      "Dutch",
      "Portuguese",
      "Belgian",
      "Swedish",
      "Norwegian",
      "Danish",
      "Finnish",
      "Czech",
      "Polish",
      "Hungarian",
      "Other",
      "Unknown",
    ],
  }).notNull(),
  difficulty: text("difficulty").notNull(),
  cookingTime: text("cooking_time").notNull(),
  servings: text("servings").notNull(),
  keyIngredients: text("key_ingredients", { mode: "json" }).$type<string[]>(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const FeaturedRecipeTableRelations = relations(FeaturedRecipeTable, ({ one }) => ({
  recipe: one(EnglishRecipesTable, {
    fields: [FeaturedRecipeTable.recipeId],
    references: [EnglishRecipesTable.id],
  }),
}));

export type FeaturedRecipe = InferSelectModel<typeof FeaturedRecipeTable>;
export type InsertFeaturedRecipe = InferInsertModel<typeof FeaturedRecipeTable>;
export const insertFeaturedRecipeSchema = createInsertSchema(FeaturedRecipeTable);
export const selectFeaturedRecipeSchema = createSelectSchema(FeaturedRecipeTable);
