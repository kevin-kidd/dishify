import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";

// User
export const UserTable = sqliteTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
});

export type User = InferSelectModel<typeof UserTable>;
export type InsertUser = InferInsertModel<typeof UserTable>;
export const insertUserSchema = createInsertSchema(UserTable);
export const selectUserSchema = createSelectSchema(UserTable);

// English recipe name table
export const EnglishRecipeNameTable = sqliteTable(
  "english_recipes",
  {
    name: text("name").primaryKey(),
  },
  (table) => ({
    nameIdx: index("name_idx").on(table.name),
  })
);
export type EnglishRecipeName = InferSelectModel<typeof EnglishRecipeNameTable>;
export type InsertEnglishRecipeName = InferInsertModel<typeof EnglishRecipeNameTable>;
export const insertEnglishRecipeNameSchema = createInsertSchema(EnglishRecipeNameTable);
export const selectEnglishRecipeNameSchema = createSelectSchema(EnglishRecipeNameTable);

// Spanish recipe name table
export const SpanishRecipeNameTable = sqliteTable("spanish_recipes", {
  name: text("name").primaryKey(),
});
export type SpanishRecipeName = InferSelectModel<typeof SpanishRecipeNameTable>;
export type InsertSpanishRecipeName = InferInsertModel<typeof SpanishRecipeNameTable>;
export const insertSpanishRecipeNameSchema = createInsertSchema(SpanishRecipeNameTable);
export const selectSpanishRecipeNameSchema = createSelectSchema(SpanishRecipeNameTable);

// German recipe name table
export const GermanRecipeNameTable = sqliteTable("german_recipes", {
  name: text("name").primaryKey(),
});
export type GermanRecipeName = InferSelectModel<typeof GermanRecipeNameTable>;
export type InsertGermanRecipeName = InferInsertModel<typeof GermanRecipeNameTable>;
export const insertGermanRecipeNameSchema = createInsertSchema(GermanRecipeNameTable);
export const selectGermanRecipeNameSchema = createSelectSchema(GermanRecipeNameTable);

// French recipe name table
export const FrenchRecipeNameTable = sqliteTable("french_recipes", {
  name: text("name").primaryKey(),
});
export type FrenchRecipeName = InferSelectModel<typeof FrenchRecipeNameTable>;
export type InsertFrenchRecipeName = InferInsertModel<typeof FrenchRecipeNameTable>;
export const insertFrenchRecipeNameSchema = createInsertSchema(FrenchRecipeNameTable);
export const selectFrenchRecipeNameSchema = createSelectSchema(FrenchRecipeNameTable);

// Italian recipe name table
export const ItalianRecipeNameTable = sqliteTable("italian_recipes", {
  name: text("name").primaryKey(),
});
export type ItalianRecipeName = InferSelectModel<typeof ItalianRecipeNameTable>;
export type InsertItalianRecipeName = InferInsertModel<typeof ItalianRecipeNameTable>;
export const insertItalianRecipeNameSchema = createInsertSchema(ItalianRecipeNameTable);
export const selectItalianRecipeNameSchema = createSelectSchema(ItalianRecipeNameTable);
