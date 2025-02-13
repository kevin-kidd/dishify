import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { UserTable } from "./user";

// Cache table for marketplace prices
export const MarketplacePricesTable = sqliteTable(
  "marketplace_prices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    marketplaceSlug: text("marketplace_slug").notNull(),
    ingredient: text("ingredient").notNull(),
    region: text("region")
      .notNull()
      .$default(() => "US"),
    price: integer("price").notNull(),
    title: text("title").notNull(),
    unit: text("unit").notNull(),
    url: text("url").notNull(),
    lastUpdated: integer("last_updated", { mode: "timestamp" })
      .notNull()
      .$default(() => new Date()),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$default(() => new Date()),
  },
  (table) => [
    uniqueIndex("marketplace_ingredient_region_idx").on(
      table.marketplaceSlug,
      table.ingredient,
      table.region,
    ),
  ],
);

// User's preferred marketplaces
export const UserMarketplacePreferencesTable = sqliteTable(
  "user_marketplace_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    marketplaceSlug: text("marketplace_slug").notNull(),
    region: text("region")
      .notNull()
      .$default(() => "US"),
    order: integer("order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$default(() => new Date()),
  },
  (table) => [uniqueIndex("user_marketplace_idx").on(table.userId, table.marketplaceSlug)],
);

// Relations
export const UserMarketplacePreferencesRelations = relations(
  UserMarketplacePreferencesTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserMarketplacePreferencesTable.userId],
      references: [UserTable.id],
    }),
  }),
);

// Types
export type UserMarketplacePreference = InferSelectModel<typeof UserMarketplacePreferencesTable>;
export type InsertUserMarketplacePreference = InferInsertModel<
  typeof UserMarketplacePreferencesTable
>;
export const insertUserMarketplacePreferenceSchema = createInsertSchema(
  UserMarketplacePreferencesTable,
);
export const selectUserMarketplacePreferenceSchema = createSelectSchema(
  UserMarketplacePreferencesTable,
);

export type MarketplacePrice = InferSelectModel<typeof MarketplacePricesTable>;
export type InsertMarketplacePrice = InferInsertModel<typeof MarketplacePricesTable>;
export const insertMarketplacePriceSchema = createInsertSchema(MarketplacePricesTable);
export const selectMarketplacePriceSchema = createSelectSchema(MarketplacePricesTable);
