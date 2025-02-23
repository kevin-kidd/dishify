import { z } from "zod";
import { publicProcedure } from "../../trpc";
import {
  MarketplacePricesTable,
  UserMarketplacePreferencesTable,
} from "../../db/schema/marketplace";
import { and, eq, gt, inArray, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { RegionSchema, type Region } from "./marketplaces/types";
import {
  getMarketplacesByRegion,
  marketplaceRegistry,
  type MarketplaceSlug,
} from "./marketplaces/registry";
import { MarketplaceError, type MarketplacePrice } from "./marketplaces/types";
import type { Env } from "../../types";
import { generateObject } from "ai";
import { EnglishRecipesTable } from "../../db/schema/recipes";
import { RecipeResponseSchema } from "../../../schemas/recipe-response";

// One week in milliseconds
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Round timestamp to start of day to avoid millisecond issues with caching
function roundToStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Update Serper API response type to handle batch responses
interface SerperShoppingResponse {
  searchParameters: {
    q: string;
    type: string;
    location: string;
    engine: string;
    gl: string;
  };
  shopping: Array<{
    title: string;
    source: string;
    link: string;
    price: string;
    delivery?: string;
    imageUrl?: string;
    rating?: number;
    ratingCount?: number;
    offers?: string;
    productId?: string;
    position?: number;
  }>;
}

type BatchSerperResponse = SerperShoppingResponse[];

// Function to fetch prices from Serper API in batch
async function fetchSerperPrices(
  ingredients: { item: string; quantity: string }[],
  location: z.infer<typeof RegionSchema>,
  apiKey: string,
): Promise<BatchSerperResponse> {
  const SERPER_API_URL = "https://google.serper.dev/shopping";

  // Create batch request data
  const batchData = ingredients.map((ingredient) => ({
    q: `${ingredient.item} ${ingredient.quantity}`,
    gl: location.toLowerCase(),
  }));

  const res = await fetch(SERPER_API_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batchData),
  });

  if (!res.ok) {
    throw new MarketplaceError(`Serper API error: ${res.statusText}`, "API_ERROR", "serper");
  }

  return res.json() as Promise<BatchSerperResponse>;
}

// Update the schema to handle multiple ingredients
const IngredientPriceMatchResponseSchema = z.object({
  ingredient: z.string(),
  quantity: z.string(),
  prices: z.array(
    z.object({
      price: z.number(), // Price in cents
      url: z.string(),
      currency: z.string(),
      unit: z.string(),
      marketplaceName: z.string(),
      marketplaceLogo: z.string().optional(),
      marketplaceSlug: z.string(), // Allow any marketplace, we'll filter later
      title: z.string(),
    }),
  ),
});

const BatchPriceMatchResponseSchema = z.object({
  ingredients: z.array(IngredientPriceMatchResponseSchema),
});

export const getMarketplacePrices = publicProcedure
  .input(
    z.object({
      ingredients: RecipeResponseSchema.shape.shoppingList,
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

    // Get cached prices for the ingredients
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
          inArray(
            MarketplacePricesTable.ingredient,
            ingredients.map((i) => i.item),
          ),
          eq(MarketplacePricesTable.region, region),
          gte(MarketplacePricesTable.lastUpdated, cacheExpiration),
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

    // Get ingredients that need fresh prices
    const ingredientsNeedingPrices = ingredients.filter((ingredient) => {
      // Check if we have valid cached prices for all marketplaces
      return !marketplaces.every((m) => {
        const cachedPrice = cachedPriceMap.get(ingredient.item)?.get(m.slug);
        // Need fresh price if:
        // 1. No cached price exists, OR
        // 2. Cached price exists but is expired
        return cachedPrice && cachedPrice.lastUpdated >= cacheExpiration;
      });
    });

    // Fetch fresh prices for cache misses
    const freshPrices: typeof cachedPrices = [];

    if (ingredientsNeedingPrices.length > 0) {
      try {
        console.log(
          `[Marketplace] Fetching fresh prices for ${ingredientsNeedingPrices.length} ingredients from Serper API`,
        );

        // Fetch all prices in one batch request
        const serperResponses = await fetchSerperPrices(
          ingredientsNeedingPrices,
          region,
          ctx.env.SERPER_API_KEY,
        );

        // Prepare the shopping results data for the AI
        const shoppingResultsData = serperResponses.map((response, index) => ({
          ingredient: ingredientsNeedingPrices[index].item,
          quantity: ingredientsNeedingPrices[index].quantity,
          results: response.shopping.slice(0, 5), // Only take first 5 results
        }));

        // Use AI to structure all prices at once
        const response = await generateObject({
          model: ctx.groq("llama-3.3-70b-versatile"),
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that structures product prices from shopping search results. For each ingredient, you will:
1. Extract prices and convert them to cents (smallest currency unit)
   - Remove currency symbols and convert string prices like "$1.99" to cents (199)
   - Handle various price formats (e.g., "$1.99", "$1,99", "1.99 USD")
2. Determine the marketplace from the source field
   - Use the exact source name as marketplaceName
   - For marketplaceSlug, use the lowercase source name
   - Only include results from the specified valid marketplaces
3. Extract or infer the unit of measurement from the title or quantity
4. Structure the data according to our schema

The response should be an array of ingredient price matches, where each match includes:
- ingredient: The exact ingredient name as provided
- quantity: The exact quantity as provided
- prices: Array of structured prices matching the schema

For each ingredient, focus on finding the most relevant products that match both the ingredient type and quantity needed.
Skip any results where you cannot confidently extract a valid price.`,
            },
            {
              role: "user",
              content: `Valid marketplaces for region ${region}:
${marketplaces.map((m) => `- ${m.name} (slug: ${m.slug})`).join("\n")}

Structure these shopping results for multiple ingredients:

${shoppingResultsData
  .map(
    (data) => `
Ingredient: ${data.ingredient}
Quantity Needed: ${data.quantity}
Search Results:
${JSON.stringify(data.results, null, 2)}
`,
  )
  .join("\n---\n")}`,
            },
          ],
          schema: BatchPriceMatchResponseSchema,
        });

        // Process each ingredient's structured prices
        for (const ingredientPrices of response.object.ingredients) {
          const ingredient = ingredientsNeedingPrices.find(
            (i) => i.item.toLowerCase() === ingredientPrices.ingredient.toLowerCase(),
          );

          if (!ingredient) {
            console.warn(
              `[Marketplace] Could not match structured prices to ingredient: ${ingredientPrices.ingredient}`,
            );
            continue;
          }

          // Filter prices to only include valid marketplaces and get lowest price per marketplace
          const validMarketplaceSlugs = new Set(marketplaces.map((m) => m.slug));
          const lowestPriceByMarketplace = new Map<
            MarketplaceSlug,
            (typeof ingredientPrices.prices)[number]
          >();

          for (const price of ingredientPrices.prices) {
            // First validate that this is a supported marketplace slug
            if (!Object.keys(marketplaceRegistry).includes(price.marketplaceSlug)) {
              console.log(
                `[Marketplace] Skipping price from unsupported marketplace "${price.marketplaceName}" for "${ingredient.item}"`,
              );
              continue;
            }

            // Now we can safely cast it since we've validated it
            const marketplaceSlug = price.marketplaceSlug as MarketplaceSlug;

            // Skip if not a valid marketplace for this region
            if (!validMarketplaceSlugs.has(marketplaceSlug)) {
              console.log(
                `[Marketplace] Skipping price from invalid marketplace "${price.marketplaceName}" for "${ingredient.item}"`,
              );
              continue;
            }

            // Update lowest price for this marketplace if needed
            const currentLowest = lowestPriceByMarketplace.get(marketplaceSlug);
            if (!currentLowest || price.price < currentLowest.price) {
              lowestPriceByMarketplace.set(marketplaceSlug, price);
            }
          }

          // Store the fresh prices in the database
          for (const [marketplaceSlug, price] of lowestPriceByMarketplace) {
            const newPrice = {
              id: crypto.randomUUID(),
              marketplaceSlug,
              ingredient: ingredient.item,
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
              console.log(
                `[Marketplace] Saved new price for "${ingredient.item}" from ${price.marketplaceName}: $${(price.price / 100).toFixed(2)}`,
              );
              freshPrices.push(newPrice);
            } catch (error: unknown) {
              // Check if it's a unique constraint error
              if (
                error &&
                typeof error === "object" &&
                "message" in error &&
                typeof error.message === "string" &&
                error.message.includes("UNIQUE constraint failed")
              ) {
                // Check if the existing price is expired
                const existingPrice = await ctx.db
                  .select()
                  .from(MarketplacePricesTable)
                  .where(
                    and(
                      eq(MarketplacePricesTable.marketplaceSlug, marketplaceSlug),
                      eq(MarketplacePricesTable.ingredient, ingredient.item),
                      eq(MarketplacePricesTable.region, region),
                    ),
                  )
                  .get();

                if (existingPrice && existingPrice.lastUpdated < cacheExpiration) {
                  // Only update if the price is actually expired
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
                        eq(MarketplacePricesTable.ingredient, ingredient.item),
                        eq(MarketplacePricesTable.region, region),
                      ),
                    );
                  console.log(
                    `[Marketplace] Updated expired price for "${ingredient.item}" from ${price.marketplaceName}: $${(price.price / 100).toFixed(2)}`,
                  );
                  freshPrices.push({ ...existingPrice, ...newPrice });
                } else {
                  console.log(
                    `[Marketplace] Skipping update for "${ingredient.item}" from ${price.marketplaceName} - price is still valid`,
                  );
                }
              } else {
                // If it's not a unique constraint error, rethrow
                throw error;
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof MarketplaceError) {
          console.warn(`[Marketplace] Failed to fetch prices: ${error.message}`);
        } else {
          console.error(
            `[Marketplace] Unexpected error fetching prices: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Combine cached and fresh prices
    const allPrices = [...cachedPrices, ...freshPrices];

    // Create a map of ingredient -> array of marketplace prices
    const pricesByIngredient: Record<string, MarketplacePrice[]> = {};

    // First, group prices by ingredient and get the lowest price for each marketplace
    const lowestPricesByIngredient = new Map<string, Map<MarketplaceSlug, MarketplacePrice>>();

    for (const price of allPrices) {
      const marketplace = marketplaces.find((m) => m.slug === price.marketplaceSlug);
      if (!marketplace) continue;

      // Initialize maps if they don't exist
      if (!lowestPricesByIngredient.has(price.ingredient)) {
        lowestPricesByIngredient.set(price.ingredient, new Map());
      }

      const marketplacePrices = lowestPricesByIngredient.get(price.ingredient);
      if (!marketplacePrices) continue; // This should never happen due to the check above

      marketplacePrices.set(price.marketplaceSlug as MarketplaceSlug, {
        price: price.price,
        url: price.url,
        currency: marketplace.defaultCurrency[region as keyof typeof marketplace.defaultCurrency],
        unit: price.unit,
        marketplaceName: marketplace.name,
        marketplaceLogo: marketplace.logo,
        marketplaceSlug: marketplace.slug,
        title: price.title,
      });
    }

    // Convert the map to the expected format
    for (const [ingredient, marketplacePrices] of lowestPricesByIngredient) {
      pricesByIngredient[ingredient] = Array.from(marketplacePrices.values());
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
