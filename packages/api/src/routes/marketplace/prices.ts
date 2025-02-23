import { z } from "zod";
import { publicProcedure } from "../../trpc";
import {
  MarketplacePricesTable,
  UserMarketplacePreferencesTable,
} from "../../db/schema/marketplace";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { and, eq, inArray, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { RegionSchema, IngredientPriceResponseSchema } from "../../../schemas/marketplace";
import { getMarketplacesByRegion, marketplaceRegistry, type MarketplaceSlug } from "./registry";
import { MarketplaceError, type MarketplacePrice, type GetIngredientPriceResponse } from "./types";
import { fetchSerperPrice } from "./serper";
import { generateObject } from "ai";

// One week in milliseconds
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Round timestamp to start of day to avoid millisecond issues with caching
function roundToStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Helper function to update estimated costs for a recipe
async function updateEstimatedCosts(
  ctx: any,
  recipeId: string,
  region: string,
  shoppingList: { item: string; quantity: string }[],
) {
  // Get all prices for this recipe's ingredients in this region
  const prices = await ctx.db
    .select()
    .from(MarketplacePricesTable)
    .where(
      and(
        eq(MarketplacePricesTable.region, region),
        inArray(
          MarketplacePricesTable.ingredient,
          shoppingList.map((item) => item.item),
        ),
      ),
    )
    .all();

  // Calculate total cost and missing ingredients
  let totalCost = 0;
  const missingIngredientsCount = shoppingList.length - prices.length;
  const totalIngredientsCount = shoppingList.length;

  // Only update if we have prices for at least 70% of ingredients
  if (prices.length >= totalIngredientsCount * 0.7) {
    // Sum up the lowest price for each ingredient
    const lowestPrices = new Map<string, number>();
    for (const price of prices) {
      const currentLowest = lowestPrices.get(price.ingredient);
      if (!currentLowest || price.price < currentLowest) {
        lowestPrices.set(price.ingredient, price.price);
      }
    }
    totalCost = Array.from(lowestPrices.values()).reduce((sum, price) => sum + price, 0);

    // Get current estimated costs
    const recipe = await ctx.db
      .select()
      .from(EnglishRecipesTable)
      .where(eq(EnglishRecipesTable.id, recipeId))
      .get();

    const currentEstimatedCosts = recipe?.estimatedCosts || {};

    // Update estimated costs for this region
    await ctx.db
      .update(EnglishRecipesTable)
      .set({
        estimatedCosts: {
          ...currentEstimatedCosts,
          [region]: {
            cost: totalCost,
            updatedAt: new Date().toISOString(),
            missingIngredientsCount,
            totalIngredientsCount,
          },
        },
      })
      .where(eq(EnglishRecipesTable.id, recipeId));
  }
}

export const getIngredientPrice = publicProcedure
  .input(
    z.object({
      ingredient: z.string(),
      quantity: z.string(),
      recipeId: z.string().optional(), // Add optional recipeId parameter
      shoppingList: z.array(z.object({ item: z.string(), quantity: z.string() })).optional(), // Add optional full shopping list
    }),
  )
  .query(async ({ ctx, input }): Promise<GetIngredientPriceResponse> => {
    const now = new Date();
    const { ingredient, quantity, recipeId, shoppingList } = input;

    // Get user's region preference or detect from Cloudflare
    let region: z.infer<typeof RegionSchema> = "US"; // Default fallback
    let regionSource = "default";

    if (ctx.user) {
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
      } else if (ctx.cf?.country && RegionSchema.safeParse(ctx.cf.country).success) {
        region = ctx.cf.country as z.infer<typeof RegionSchema>;
        regionSource = "cloudflare_detected";

        await ctx.db.insert(UserMarketplacePreferencesTable).values({
          userId: ctx.user.id,
          marketplaceSlug: "default",
          region,
          order: 0,
        });
      }
    } else if (ctx.cf?.country && RegionSchema.safeParse(ctx.cf.country).success) {
      region = ctx.cf.country as z.infer<typeof RegionSchema>;
      regionSource = "cloudflare_detected";
    }

    // Get active marketplaces from registry
    const marketplaces = getMarketplacesByRegion(region);
    if (!marketplaces.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No active marketplaces found for region: ${region}`,
      });
    }

    // Check cache for this ingredient
    const cacheExpiration = roundToStartOfDay(new Date(now.getTime() - CACHE_DURATION));
    const cachedPrices = await ctx.db
      .select()
      .from(MarketplacePricesTable)
      .where(
        and(
          inArray(
            MarketplacePricesTable.marketplaceSlug,
            marketplaces.map((m) => m.slug),
          ),
          eq(MarketplacePricesTable.ingredient, ingredient),
          eq(MarketplacePricesTable.region, region),
          gte(MarketplacePricesTable.lastUpdated, cacheExpiration),
        ),
      )
      .all();

    // If we have valid cached prices for all marketplaces, return them
    if (cachedPrices.length === marketplaces.length) {
      const prices: MarketplacePrice[] = cachedPrices.map((price) => {
        const marketplace = marketplaces.find((m) => m.slug === price.marketplaceSlug);
        if (!marketplace) {
          throw new Error(`Marketplace ${price.marketplaceSlug} not found in registry`);
        }
        return {
          price: price.price,
          url: price.url,
          currency: marketplace.defaultCurrency[region as keyof typeof marketplace.defaultCurrency],
          unit: price.unit,
          marketplaceName: marketplace.name,
          marketplaceLogo: marketplace.logo,
          marketplaceSlug: marketplace.slug,
          title: price.title,
        };
      });

      return {
        prices,
        region,
      };
    }

    // Fetch fresh prices from Serper API
    try {
      const serperResponse = await fetchSerperPrice(
        { item: ingredient, quantity },
        region,
        ctx.env.SERPER_API_KEY,
      );

      // Prepare shopping results for AI
      const shoppingResultsData = {
        ingredient,
        quantity,
        results: serperResponse.shopping.slice(0, 5), // Only take first 5 results
      };

      // Use AI to structure prices
      const response = await generateObject({
        model: ctx.groq("llama-3.3-70b-versatile"),
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that structures product prices from shopping search results. You will:
1. Extract prices and convert them to cents (smallest currency unit)
   - Remove currency symbols and convert string prices like "$1.99" to cents (199)
   - Handle various price formats (e.g., "$1.99", "$1,99", "1.99 USD")
2. Determine the marketplace from the source field
   - Use the exact source name as marketplaceName
   - For marketplaceSlug, use the lowercase source name
   - Only include results from the specified valid marketplaces
3. Extract or infer the unit of measurement from the title or quantity
4. Structure the data according to our schema

Skip any results where you cannot confidently extract a valid price.`,
          },
          {
            role: "user",
            content: `Valid marketplaces for region ${region}:
${marketplaces.map((m) => `- ${m.name} (slug: ${m.slug})`).join("\n")}

Structure these shopping results:

Ingredient: ${shoppingResultsData.ingredient}
Quantity Needed: ${shoppingResultsData.quantity}
Search Results:
${JSON.stringify(shoppingResultsData.results, null, 2)}`,
          },
        ],
        schema: IngredientPriceResponseSchema,
      });

      // Filter and store prices
      const validMarketplaceSlugs = new Set(marketplaces.map((m) => m.slug));
      const lowestPriceByMarketplace = new Map<
        MarketplaceSlug,
        z.infer<typeof IngredientPriceResponseSchema>["prices"][number]
      >();

      for (const price of response.object.prices) {
        if (!Object.keys(marketplaceRegistry).includes(price.marketplaceSlug)) {
          continue;
        }

        const marketplaceSlug = price.marketplaceSlug as MarketplaceSlug;
        if (!validMarketplaceSlugs.has(marketplaceSlug)) {
          continue;
        }

        const currentLowest = lowestPriceByMarketplace.get(marketplaceSlug);
        if (!currentLowest || price.price < currentLowest.price) {
          lowestPriceByMarketplace.set(marketplaceSlug, price);
        }
      }

      // Store fresh prices in database
      const freshPrices: MarketplacePrice[] = [];
      for (const [marketplaceSlug, price] of lowestPriceByMarketplace) {
        const newPrice = {
          id: crypto.randomUUID(),
          marketplaceSlug,
          ingredient,
          region,
          price: price.price,
          unit: price.unit,
          url: price.url,
          title: price.title,
          lastUpdated: now,
          createdAt: now,
        };

        try {
          await ctx.db.insert(MarketplacePricesTable).values(newPrice);
          const marketplace = marketplaces.find((m) => m.slug === marketplaceSlug);
          if (!marketplace) {
            throw new Error(`Marketplace ${marketplaceSlug} not found in registry`);
          }
          freshPrices.push({
            ...price,
            marketplaceName: marketplace.name,
            marketplaceLogo: marketplace.logo,
            marketplaceSlug: marketplace.slug,
            currency:
              marketplace.defaultCurrency[region as keyof typeof marketplace.defaultCurrency],
          });
        } catch (error: unknown) {
          if (
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string" &&
            error.message.includes("UNIQUE constraint failed")
          ) {
            const existingPrice = await ctx.db
              .select()
              .from(MarketplacePricesTable)
              .where(
                and(
                  eq(MarketplacePricesTable.marketplaceSlug, marketplaceSlug),
                  eq(MarketplacePricesTable.ingredient, ingredient),
                  eq(MarketplacePricesTable.region, region),
                ),
              )
              .get();

            if (existingPrice && existingPrice.lastUpdated < cacheExpiration) {
              await ctx.db
                .update(MarketplacePricesTable)
                .set({
                  price: price.price,
                  unit: price.unit,
                  url: price.url,
                  title: price.title,
                  lastUpdated: now,
                })
                .where(
                  and(
                    eq(MarketplacePricesTable.marketplaceSlug, marketplaceSlug),
                    eq(MarketplacePricesTable.ingredient, ingredient),
                    eq(MarketplacePricesTable.region, region),
                  ),
                );

              const marketplace = marketplaces.find((m) => m.slug === marketplaceSlug);
              if (!marketplace) {
                throw new Error(`Marketplace ${marketplaceSlug} not found in registry`);
              }
              freshPrices.push({
                ...price,
                marketplaceName: marketplace.name,
                marketplaceLogo: marketplace.logo,
                marketplaceSlug: marketplace.slug,
                currency:
                  marketplace.defaultCurrency[region as keyof typeof marketplace.defaultCurrency],
              });
            }
          } else {
            throw error;
          }
        }
      }

      // Combine cached and fresh prices
      const allPrices = [
        ...cachedPrices.map((price) => {
          const marketplace = marketplaces.find((m) => m.slug === price.marketplaceSlug);
          if (!marketplace) {
            throw new Error(`Marketplace ${price.marketplaceSlug} not found in registry`);
          }
          return {
            price: price.price,
            url: price.url,
            currency:
              marketplace.defaultCurrency[region as keyof typeof marketplace.defaultCurrency],
            unit: price.unit,
            marketplaceName: marketplace.name,
            marketplaceLogo: marketplace.logo,
            marketplaceSlug: marketplace.slug,
            title: price.title,
          };
        }),
        ...freshPrices,
      ];

      // After storing fresh prices, update estimated costs if we have recipe context
      if (recipeId && shoppingList) {
        await updateEstimatedCosts(ctx, recipeId, region, shoppingList);
      }

      return {
        prices: allPrices,
        region,
      };
    } catch (error: unknown) {
      if (error instanceof MarketplaceError) {
        console.warn(`[Marketplace] Failed to fetch prices: ${error.message}`);
      } else {
        console.error(
          `[Marketplace] Unexpected error fetching prices: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
      throw error;
    }
  });
