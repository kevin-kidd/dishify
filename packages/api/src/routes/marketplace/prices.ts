import { z } from "zod";
import { publicProcedure } from "../../trpc";
import {
  MarketplacePricesTable,
  UserMarketplacePreferencesTable,
} from "../../db/schema/marketplace";
import { and, eq, gt, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { RegionSchema, type Region } from "./marketplaces/types";
import { getMarketplacesByRegion } from "./marketplaces/registry";
import { MarketplaceError, type MarketplacePrice } from "./marketplaces/types";
import type { Env } from "../../types";
import { generateObject } from "ai";
import { EnglishRecipesTable } from "../../db/schema/recipes";

// One week in milliseconds
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Interface for marketplace API adapters
export interface MarketplaceAPI {
  searchIngredient: (
    ingredient: string,
    region: string,
    env: Env,
  ) => Promise<{
    price: number; // Price in cents
    url: string;
  }>;
}

// Schema for AI response
const PriceMatchResponseSchema = z.object({
  index: z.number(),
});

export const getMarketplacePrices = publicProcedure
  .input(
    z.object({
      ingredients: z.array(z.string()),
      recipeId: z.string().optional(), // Optional recipe ID to update estimated costs
    }),
  )
  .query(async ({ ctx, input }) => {
    const { ingredients, recipeId } = input;
    const now = new Date();

    // Get user's region preference or detect from Cloudflare
    let region: z.infer<typeof RegionSchema> = "US"; // Default fallback
    let regionSource = "default";

    if (ctx.user) {
      // If user is logged in, try to get their region preference
      const preferences = await ctx.db
        .select()
        .from(UserMarketplacePreferencesTable)
        .where(eq(UserMarketplacePreferencesTable.userId, ctx.user.id))
        .orderBy(desc(UserMarketplacePreferencesTable.updatedAt))
        .limit(1)
        .all();

      if (preferences.length > 0 && preferences[0].region) {
        region = preferences[0].region as z.infer<typeof RegionSchema>;
        regionSource = "user_preference";
        console.log(`[Marketplace] Using user's preferred region: ${region}`);
      } else if (ctx.cf?.country && RegionSchema.safeParse(ctx.cf.country).success) {
        region = ctx.cf.country as z.infer<typeof RegionSchema>;
        regionSource = "cloudflare_detected";
        console.log(`[Marketplace] Using Cloudflare detected region: ${region}`);

        // Save the detected region as user's preference
        await ctx.db.insert(UserMarketplacePreferencesTable).values({
          userId: ctx.user.id,
          marketplaceSlug: "default",
          region,
          order: 0,
        });
        console.log(`[Marketplace] Saved detected region ${region} as user preference`);
      } else {
        console.log(
          `[Marketplace] Using default region: ${region} (no valid user preference or Cloudflare detection)`,
        );
      }
    } else if (ctx.cf?.country && RegionSchema.safeParse(ctx.cf.country).success) {
      region = ctx.cf.country as z.infer<typeof RegionSchema>;
      regionSource = "cloudflare_detected";
      console.log(`[Marketplace] Using Cloudflare detected region for anonymous user: ${region}`);
    } else {
      console.log(`[Marketplace] Using default region for anonymous user: ${region}`);
    }

    // Get active marketplaces from registry
    const marketplaces = getMarketplacesByRegion(region);
    console.log(
      `[Marketplace] Found ${marketplaces.length} active marketplaces for region ${region}`,
    );

    if (!marketplaces.length) {
      console.warn(
        `[Marketplace] No active marketplaces found for region: ${region} (source: ${regionSource})`,
      );
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No active marketplaces found for region: ${region}`,
      });
    }

    // Log marketplace details
    for (const marketplace of marketplaces) {
      console.log(
        `[Marketplace] Active marketplace: ${marketplace.config.name} (${marketplace.config.slug})`,
      );
    }

    // Get cached prices for the ingredients
    const cachedPrices = await ctx.db
      .select()
      .from(MarketplacePricesTable)
      .where(
        and(
          inArray(
            MarketplacePricesTable.marketplaceSlug,
            marketplaces.map((m) => m.config.slug),
          ),
          inArray(MarketplacePricesTable.ingredient, ingredients),
          eq(MarketplacePricesTable.region, region),
          gt(MarketplacePricesTable.lastUpdated, new Date(now.getTime() - CACHE_DURATION)), // Within last week
        ),
      )
      .all();

    // Log cache hit/miss statistics
    const totalPricesNeeded = ingredients.length * marketplaces.length;
    const cacheHits = cachedPrices.length;
    const cacheMisses = totalPricesNeeded - cacheHits;
    const cacheHitRate = totalPricesNeeded > 0 ? (cacheHits / totalPricesNeeded) * 100 : 0;

    console.log(
      "[Marketplace] Cache statistics:",
      `\n  - Total prices needed: ${totalPricesNeeded}`,
      `\n  - Cache hits: ${cacheHits}`,
      `\n  - Cache misses: ${cacheMisses}`,
      `\n  - Cache hit rate: ${cacheHitRate.toFixed(1)}%`,
    );

    // Create a map of cached prices for quick lookup
    const cachedPriceMap = new Map<string, Map<string, (typeof cachedPrices)[number]>>();
    for (const price of cachedPrices) {
      if (!cachedPriceMap.has(price.ingredient)) {
        cachedPriceMap.set(price.ingredient, new Map());
      }
      cachedPriceMap.get(price.ingredient)?.set(price.marketplaceSlug, price);
    }

    // Fetch fresh prices for cache misses
    const freshPrices: typeof cachedPrices = [];
    for (const ingredient of ingredients) {
      for (const marketplace of marketplaces) {
        // Skip if we already have a cached price
        if (cachedPriceMap.get(ingredient)?.has(marketplace.config.slug)) {
          continue;
        }

        try {
          console.log(
            `[Marketplace] Fetching fresh price for "${ingredient}" from ${marketplace.config.name}`,
          );
          const price = await marketplace.searchIngredient(ingredient, region, ctx.env);

          if (price.length > 1) {
            // Use AI to select the best matching price
            console.log(
              `[Marketplace] Found ${price.length} prices for "${ingredient}" from ${marketplace.config.name}, using AI to select best match`,
            );

            const response = await generateObject({
              model: ctx.groq("llama-3.3-70b-versatile"),
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful assistant that selects the most relevant product from a list based on the ingredient name. Return the index of the best matching product or -1 if none match well.",
                },
                {
                  role: "user",
                  content: `Select the index of the product that best matches the ingredient "${ingredient}" from these options:\n${price.map((p, i) => `${i}: ${p.title}`).join("\n")}\nIf none match well, return -1.`,
                },
              ],
              schema: PriceMatchResponseSchema,
            });

            const selectedIndex = response.object.index;
            console.log(
              `[Marketplace] AI selected index ${selectedIndex} for "${ingredient}" from ${marketplace.config.name}`,
            );

            if (selectedIndex >= 0 && selectedIndex < price.length) {
              const selectedPrice = price[selectedIndex];
              // Store the fresh price in the database
              const newPrice = {
                id: crypto.randomUUID(),
                marketplaceSlug: marketplace.config.slug,
                ingredient,
                region,
                price: selectedPrice.price,
                unit: selectedPrice.unit,
                url: selectedPrice.url,
                title: selectedPrice.title,
                lastUpdated: now,
                createdAt: now,
              };

              await ctx.db.insert(MarketplacePricesTable).values(newPrice);
              console.log(
                `[Marketplace] Saved fresh price for "${ingredient}" from ${marketplace.config.name}: $${(selectedPrice.price / 100).toFixed(2)}`,
              );

              freshPrices.push(newPrice);
            } else {
              console.log(
                `[Marketplace] AI did not find a good match for "${ingredient}" from ${marketplace.config.name}`,
              );
            }
          } else if (price.length === 1) {
            // If only one price, use it directly
            const singlePrice = price[0];
            const newPrice = {
              id: crypto.randomUUID(),
              marketplaceSlug: marketplace.config.slug,
              ingredient,
              region,
              price: singlePrice.price,
              unit: singlePrice.unit,
              url: singlePrice.url,
              title: singlePrice.title,
              lastUpdated: now,
              createdAt: now,
            };

            await ctx.db.insert(MarketplacePricesTable).values(newPrice);
            console.log(
              `[Marketplace] Saved fresh price for "${ingredient}" from ${marketplace.config.name}: $${(singlePrice.price / 100).toFixed(2)}`,
            );

            freshPrices.push(newPrice);
          }
        } catch (error: unknown) {
          if (error instanceof MarketplaceError) {
            console.warn(
              `[Marketplace] Failed to fetch price for "${ingredient}" from ${marketplace.config.name}: ${error.message}`,
            );
          } else {
            console.error(
              `[Marketplace] Unexpected error fetching price for "${ingredient}" from ${
                marketplace.config.name
              }: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }
      }
    }

    // Combine cached and fresh prices
    const allPrices = [...cachedPrices, ...freshPrices];

    // Create a map of ingredient -> array of marketplace prices
    const pricesByIngredient: Record<string, MarketplacePrice[]> = {};

    for (const price of allPrices) {
      const marketplace = marketplaces.find((m) => m.config.slug === price.marketplaceSlug);
      if (!marketplace) continue;

      if (!pricesByIngredient[price.ingredient]) {
        pricesByIngredient[price.ingredient] = [];
      }

      // Get the currency for this marketplace's region
      const currency = marketplace.getCurrencyForRegion(region);
      if (!currency) continue;

      pricesByIngredient[price.ingredient].push({
        price: price.price,
        url: price.url,
        currency,
        unit: price.unit,
        marketplaceName: marketplace.config.name,
        marketplaceLogo: marketplace.config.logo,
        marketplaceSlug: marketplace.config.slug,
        title: price.title,
      });
    }

    // Calculate total cost and update recipe if needed
    if (recipeId) {
      const missingIngredientsCount = ingredients.length - Object.keys(pricesByIngredient).length;
      const totalIngredientsCount = ingredients.length;
      const missingPercentage = (missingIngredientsCount / totalIngredientsCount) * 100;

      // Only update estimated cost if we have prices for at least 70% of ingredients
      if (missingPercentage <= 30) {
        // Calculate total cost from lowest price for each ingredient
        const totalCost = Object.values(pricesByIngredient).reduce((sum, marketplacePrices) => {
          // Find the lowest price for this ingredient
          const lowestPrice = marketplacePrices.reduce(
            (min, price) => (price.price < min ? price.price : min),
            marketplacePrices[0]?.price ?? 0,
          );
          return sum + lowestPrice;
        }, 0);

        // Get the current recipe
        const recipe = await ctx.db
          .select()
          .from(EnglishRecipesTable)
          .where(eq(EnglishRecipesTable.id, recipeId))
          .get();

        if (recipe) {
          // Update or create estimated costs for this region
          const estimatedCosts = recipe.estimatedCosts ?? {};
          estimatedCosts[region] = {
            cost: totalCost,
            updatedAt: now.toISOString(),
            missingIngredientsCount,
            totalIngredientsCount,
          };

          await ctx.db
            .update(EnglishRecipesTable)
            .set({
              estimatedCosts,
              updatedAt: now.toISOString(),
            })
            .where(eq(EnglishRecipesTable.id, recipeId));

          console.log(
            `[Marketplace] Updated estimated cost for recipe ${recipeId} in region ${region}: $${(totalCost / 100).toFixed(2)}`,
          );
        }
      } else {
        console.log(
          `[Marketplace] Skipping cost update for recipe ${recipeId} - missing ${missingPercentage.toFixed(1)}% of ingredients`,
        );
      }
    }

    return {
      prices: pricesByIngredient,
      region,
    };
  });
