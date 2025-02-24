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
import { tryCatch } from "@dishify/app/utils/helpers";

// One week in milliseconds
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Round timestamp to start of day to avoid millisecond issues with caching
function roundToStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Common unit conversions for cooking measurements
const unitConversions: Record<string, Record<string, number>> = {
  volume: {
    // Base unit: ml
    ml: 1,
    milliliter: 1,
    millilitre: 1,
    "milliliter(s)": 1,
    "millilitre(s)": 1,
    l: 1000,
    liter: 1000,
    litre: 1000,
    "liter(s)": 1000,
    "litre(s)": 1000,
    cup: 236.588,
    "cup(s)": 236.588,
    cups: 236.588,
    tbsp: 14.7868,
    "tablespoon(s)": 14.7868,
    tablespoon: 14.7868,
    tablespoons: 14.7868,
    tsp: 4.92892,
    "teaspoon(s)": 4.92892,
    teaspoon: 4.92892,
    teaspoons: 4.92892,
    "fluid ounce": 29.5735,
    "fluid ounces": 29.5735,
    "fl oz": 29.5735,
    "fl. oz.": 29.5735,
    gallon: 3785.41,
    "gallon(s)": 3785.41,
    gallons: 3785.41,
    quart: 946.353,
    "quart(s)": 946.353,
    quarts: 946.353,
    pint: 473.176,
    "pint(s)": 473.176,
    pints: 473.176,
  },
  weight: {
    // Base unit: g
    g: 1,
    gram: 1,
    "gram(s)": 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    "kilogram(s)": 1000,
    kilograms: 1000,
    oz: 28.3495,
    ounce: 28.3495,
    "ounce(s)": 28.3495,
    ounces: 28.3495,
    lb: 453.592,
    pound: 453.592,
    "pound(s)": 453.592,
    pounds: 453.592,
  },
};

/**
 * Parses a quantity string and attempts to normalize it to a standard unit
 * @param quantityStr - The quantity string to parse (e.g., "2 cups", "500g")
 * @returns An object with the parsed quantity and unit, or null if parsing fails
 */
function parseQuantity(quantityStr: string): { amount: number; unit: string } | null {
  try {
    // Clean up the input string
    const cleanStr = quantityStr.toLowerCase().trim();

    // Handle common fraction formats
    const fractionReplacements: Record<string, string> = {
      "½": "0.5",
      "⅓": "0.333",
      "⅔": "0.667",
      "¼": "0.25",
      "¾": "0.75",
      "⅕": "0.2",
      "⅖": "0.4",
      "⅗": "0.6",
      "⅘": "0.8",
      "⅙": "0.167",
      "⅚": "0.833",
      "⅐": "0.143",
      "⅛": "0.125",
      "⅜": "0.375",
      "⅝": "0.625",
      "⅞": "0.875",
    };

    let processedStr = cleanStr;
    for (const [fraction, decimal] of Object.entries(fractionReplacements)) {
      processedStr = processedStr.replace(fraction, decimal);
    }

    // Handle written fractions like "1/2"
    processedStr = processedStr.replace(/(\d+)\/(\d+)/g, (_, numerator, denominator) => {
      return (Number.parseInt(numerator, 10) / Number.parseInt(denominator, 10)).toString();
    });

    // Extract number and unit
    const numberMatch = processedStr.match(/^([\d.]+)/);
    if (!numberMatch) return null;

    const amount = Number.parseFloat(numberMatch[1]);
    if (Number.isNaN(amount)) return null;

    // Extract unit
    let unit = processedStr.substring(numberMatch[0].length).trim();

    // Handle units attached directly to the number (e.g., "500g")
    if (unit === "") {
      const unitMatch = processedStr.match(/[\d.]+([a-zA-Z]+)/);
      unit = unitMatch ? unitMatch[1] : "";
    }

    return { amount, unit };
  } catch (error) {
    console.warn(`Failed to parse quantity: ${quantityStr}`, error);
    return null;
  }
}

/**
 * Attempts to convert quantities to a common unit for comparison
 * @param amount - The amount to convert
 * @param fromUnit - The unit to convert from
 * @param toUnit - The unit to convert to
 * @returns The converted amount or null if conversion is not possible
 */
function convertQuantity(amount: number, fromUnit: string, toUnit: string): number | null {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return amount;

  // Find which category the units belong to
  let category: string | null = null;
  let fromFactor = 0;
  let toFactor = 0;

  for (const [cat, units] of Object.entries(unitConversions)) {
    if (fromUnit in units && toUnit in units) {
      category = cat;
      fromFactor = units[fromUnit];
      toFactor = units[toUnit];
      break;
    }
  }

  if (!category) return null; // Cannot convert between these units

  // Convert to base unit, then to target unit
  const baseAmount = amount * fromFactor;
  return baseAmount / toFactor;
}

/**
 * Calculates the proportional cost of an ingredient based on the recipe quantity and product quantity
 * @param recipeQuantity - The quantity needed for the recipe
 * @param productQuantity - The quantity available in the product
 * @param productPrice - The price of the product in cents
 * @returns The proportional cost or the full product price if conversion fails
 */
function calculateProportionalCost(
  recipeQuantity: string,
  productQuantity: string | undefined,
  productPrice: number,
): number {
  // If no product quantity is available, return the full price
  if (!productQuantity) {
    return productPrice;
  }

  const parsedRecipe = parseQuantity(recipeQuantity);
  const parsedProduct = parseQuantity(productQuantity);

  // If parsing fails for either quantity, return the full price
  if (!parsedRecipe || !parsedProduct) {
    // If we have a recipe quantity but no product quantity, make a best guess
    if (parsedRecipe && !parsedProduct && productQuantity) {
      // Try to extract just numbers from the product quantity as a fallback
      const numericMatch = productQuantity.match(/(\d+(\.\d+)?)/);
      if (numericMatch) {
        const numericQuantity = Number.parseFloat(numericMatch[0]);
        if (!Number.isNaN(numericQuantity) && numericQuantity > 0) {
          // Assume the units are compatible and calculate a rough proportion
          // This is a fallback when we can't properly parse the units
          const proportion = parsedRecipe.amount / numericQuantity;
          // Cap the proportion at 1.0 to avoid overestimating costs
          const cappedProportion = Math.min(proportion, 1.0);
          return Math.ceil(productPrice * cappedProportion);
        }
      }
    }

    // If all else fails, return the full price
    return productPrice;
  }

  // Try to convert to a common unit if units differ
  if (parsedRecipe.unit !== parsedProduct.unit) {
    const convertedAmount = convertQuantity(
      parsedRecipe.amount,
      parsedRecipe.unit,
      parsedProduct.unit,
    );

    // If conversion succeeds, calculate proportional cost
    if (convertedAmount !== null) {
      const proportion = convertedAmount / parsedProduct.amount;
      // Cap the proportion at 1.0 to avoid overestimating costs
      const cappedProportion = Math.min(proportion, 1.0);
      return Math.ceil(productPrice * cappedProportion);
    }

    // If conversion fails, try a simple numeric comparison as fallback
    // This assumes the units might be compatible even if we don't know how to convert them
    const proportion = parsedRecipe.amount / parsedProduct.amount;
    // Only use this fallback if the proportion seems reasonable (less than 1.0)
    if (proportion < 1.0) {
      return Math.ceil(productPrice * proportion);
    }
  } else {
    // Units are the same, calculate proportion directly
    const proportion = parsedRecipe.amount / parsedProduct.amount;
    // Cap the proportion at 1.0 to avoid overestimating costs
    const cappedProportion = Math.min(proportion, 1.0);
    return Math.ceil(productPrice * cappedProportion);
  }

  // If all else fails, return the full price
  return productPrice;
}

// Helper function to update estimated costs for a recipe
async function updateEstimatedCosts(
  ctx: any,
  recipeId: string,
  region: string,
  shoppingList: { item: string; quantity: string }[],
) {
  // Get all prices for this recipe's ingredients in this region
  const { data: prices, error: pricesError } = await tryCatch(
    ctx.db
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
      .all(),
  );

  if (pricesError) {
    console.error("Failed to fetch ingredient prices for cost estimation:", {
      error: pricesError.message,
      recipeId,
      region,
    });
    return;
  }

  // Calculate total cost and missing ingredients
  let totalCost = 0;
  const pricesArray = (prices as any[]) || [];
  const missingIngredientsCount =
    shoppingList.length - new Set(pricesArray.map((p) => p.ingredient)).size;
  const totalIngredientsCount = shoppingList.length;

  // Track ingredients we've already processed to avoid duplicates
  const processedIngredients = new Set<string>();

  // Only update if we have prices for at least 70% of ingredients
  if (
    pricesArray.length > 0 &&
    totalIngredientsCount - missingIngredientsCount >= totalIngredientsCount * 0.7
  ) {
    // Group prices by ingredient
    const pricesByIngredient = new Map<string, any[]>();
    for (const price of pricesArray) {
      if (!pricesByIngredient.has(price.ingredient)) {
        pricesByIngredient.set(price.ingredient, []);
      }
      pricesByIngredient.get(price.ingredient)?.push(price);
    }

    // Calculate cost for each ingredient using the cheapest option
    for (const item of shoppingList) {
      const ingredient = item.item; // Use item property from shopping list

      // Skip if we've already processed this ingredient
      if (processedIngredients.has(ingredient)) continue;
      processedIngredients.add(ingredient);

      const ingredientPrices = pricesByIngredient.get(ingredient);
      if (!ingredientPrices || ingredientPrices.length === 0) continue;

      // Find the cheapest price for this ingredient
      let cheapestPrice = ingredientPrices[0];
      let cheapestProportionalCost = calculateProportionalCost(
        item.quantity,
        cheapestPrice.unit, // Using unit as product quantity
        cheapestPrice.price,
      );

      // Log the calculation for debugging
      console.debug(`Cost calculation for ${ingredient}:`, {
        recipeQuantity: item.quantity,
        productQuantity: cheapestPrice.unit,
        fullPrice: cheapestPrice.price,
        proportionalCost: cheapestProportionalCost,
      });

      for (let i = 1; i < ingredientPrices.length; i++) {
        const currentPrice = ingredientPrices[i];
        const currentProportionalCost = calculateProportionalCost(
          item.quantity,
          currentPrice.unit, // Using unit as product quantity
          currentPrice.price,
        );

        // Log each comparison for debugging
        console.debug(`Comparing price option ${i} for ${ingredient}:`, {
          recipeQuantity: item.quantity,
          productQuantity: currentPrice.unit,
          fullPrice: currentPrice.price,
          proportionalCost: currentProportionalCost,
          isCheaper: currentProportionalCost < cheapestProportionalCost,
        });

        if (currentProportionalCost < cheapestProportionalCost) {
          cheapestPrice = currentPrice;
          cheapestProportionalCost = currentProportionalCost;
        }
      }

      // Add to total cost
      totalCost += cheapestProportionalCost;
    }

    // Get current estimated costs
    const { data: recipe, error: recipeError } = await tryCatch(
      ctx.db.select().from(EnglishRecipesTable).where(eq(EnglishRecipesTable.id, recipeId)).get(),
    );

    if (recipeError) {
      console.error("Failed to fetch recipe for cost estimation:", {
        error: recipeError.message,
        recipeId,
      });
      return;
    }

    const recipeData = (recipe as any) || {};
    const currentEstimatedCosts = recipeData.estimatedCosts || {};

    // Update estimated costs for this region
    const { error: updateError } = await tryCatch(
      ctx.db
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
        .where(eq(EnglishRecipesTable.id, recipeId)),
    );

    if (updateError) {
      console.error("Failed to update recipe estimated costs:", {
        error: updateError.message,
        recipeId,
        region,
      });
    }
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
      const { data: preferences, error: preferencesError } = await tryCatch(
        ctx.db
          .select()
          .from(UserMarketplacePreferencesTable)
          .where(eq(UserMarketplacePreferencesTable.userId, ctx.user.id))
          .orderBy(desc(UserMarketplacePreferencesTable.updatedAt))
          .limit(1)
          .all(),
      );

      if (preferencesError) {
        console.error("Failed to fetch user marketplace preferences:", {
          error: preferencesError.message,
          userId: ctx.user.id,
        });
      } else if (preferences && preferences.length > 0 && preferences[0].region) {
        region = preferences[0].region as z.infer<typeof RegionSchema>;
        regionSource = "user_preference";
      } else if (ctx.cf?.country && RegionSchema.safeParse(ctx.cf.country).success) {
        region = ctx.cf.country as z.infer<typeof RegionSchema>;
        regionSource = "cloudflare_detected";

        const { error: insertError } = await tryCatch(
          ctx.db.insert(UserMarketplacePreferencesTable).values({
            userId: ctx.user.id,
            marketplaceSlug: "default",
            region,
            order: 0,
          }),
        );

        if (insertError) {
          console.error("Failed to insert user marketplace preferences:", {
            error: insertError.message,
            userId: ctx.user.id,
            region,
          });
        }
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
    const { data: cachedPrices, error: cachedPricesError } = await tryCatch(
      ctx.db
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
        .all(),
    );

    if (cachedPricesError) {
      console.error("Failed to fetch cached prices:", {
        error: cachedPricesError.message,
        ingredient,
        region,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch cached prices",
      });
    }

    // If we have valid cached prices for all marketplaces, return them
    if (cachedPrices && cachedPrices.length === marketplaces.length) {
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
      const { data: serperResponse, error: serperError } = await tryCatch(
        fetchSerperPrice({ item: ingredient, quantity }, region, ctx.env.SERPER_API_KEY),
      );

      if (serperError) {
        console.error("Failed to fetch prices from Serper API:", {
          error: serperError.message,
          ingredient,
          region,
        });
        throw new MarketplaceError("Failed to fetch prices from search API", "API_ERROR", "serper");
      }

      // Prepare shopping results for AI
      const shoppingResultsData = {
        ingredient,
        quantity,
        results: serperResponse?.shopping.slice(0, 5) || [], // Only take first 5 results
      };

      // Use AI to structure prices
      const { data: response, error: aiError } = await tryCatch(
        generateObject({
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
3. Extract or infer the unit of measurement and quantity from the title
   - Look for quantity patterns like "500g", "32 oz", "1 lb", "5 pounds", etc.
   - Include both amount and unit in the unit field (e.g., "16 oz" not just "oz")
   - Be as specific as possible about the quantity (e.g., "500g" is better than just "g")
   - If no specific quantity is found, make a reasonable estimate based on the product type
   - For packaged goods, look for package sizes (e.g., "12-pack", "family size", etc.)
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
        }),
      );

      if (aiError) {
        console.error("Failed to structure prices with AI:", {
          error: aiError.message,
          ingredient,
          region,
        });
        throw new MarketplaceError("Failed to structure prices", "API_ERROR", "ai");
      }

      // Filter and store prices
      const validMarketplaceSlugs = new Set(marketplaces.map((m) => m.slug));
      const lowestPriceByMarketplace = new Map<
        MarketplaceSlug,
        z.infer<typeof IngredientPriceResponseSchema>["prices"][number]
      >();

      if (response?.object?.prices) {
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
          const { error: insertError } = await tryCatch(
            ctx.db.insert(MarketplacePricesTable).values(newPrice),
          );

          if (insertError) {
            // Check if it's a unique constraint error
            if (
              typeof insertError === "object" &&
              insertError &&
              "message" in insertError &&
              typeof insertError.message === "string" &&
              insertError.message.includes("UNIQUE constraint failed")
            ) {
              const { data: existingPrice, error: existingPriceError } = await tryCatch(
                ctx.db
                  .select()
                  .from(MarketplacePricesTable)
                  .where(
                    and(
                      eq(MarketplacePricesTable.marketplaceSlug, marketplaceSlug),
                      eq(MarketplacePricesTable.ingredient, ingredient),
                      eq(MarketplacePricesTable.region, region),
                    ),
                  )
                  .get(),
              );

              if (existingPriceError) {
                console.error("Failed to fetch existing price after constraint error:", {
                  error: existingPriceError.message,
                  marketplaceSlug,
                  ingredient,
                  region,
                });
                continue;
              }

              if (existingPrice && existingPrice.lastUpdated < cacheExpiration) {
                const { error: updateError } = await tryCatch(
                  ctx.db
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
                    ),
                );

                if (updateError) {
                  console.error("Failed to update existing price:", {
                    error: updateError.message,
                    marketplaceSlug,
                    ingredient,
                    region,
                  });
                  continue;
                }
              }
            } else {
              console.error("Failed to insert new price:", {
                error: insertError.message,
                marketplaceSlug,
                ingredient,
                region,
              });
              continue;
            }
          }

          const marketplace = marketplaces.find((m) => m.slug === marketplaceSlug);
          if (!marketplace) {
            console.error(`Marketplace ${marketplaceSlug} not found in registry`);
            continue;
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
          console.error("Unexpected error handling price insertion:", {
            error: error instanceof Error ? error.message : "Unknown error",
            marketplaceSlug,
            ingredient,
            region,
          });
        }
      }

      // Combine cached and fresh prices
      const cachedPricesArray = cachedPrices ?? [];
      const allPricesUnsorted = [
        ...cachedPricesArray.map((price) => {
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

      // Filter to keep only the lowest price for each marketplace
      const uniquePricesByMarketplace = new Map<MarketplaceSlug, MarketplacePrice>();

      for (const price of allPricesUnsorted) {
        const slug = price.marketplaceSlug as MarketplaceSlug;
        const currentLowest = uniquePricesByMarketplace.get(slug);

        if (currentLowest) {
          // Log when we find duplicate marketplace entries
          console.debug(`Found duplicate price for marketplace ${slug}:`, {
            existing: {
              price: currentLowest.price,
              title: currentLowest.title,
            },
            new: {
              price: price.price,
              title: price.title,
            },
            keepingCheaper: price.price < currentLowest.price ? "new" : "existing",
          });
        }

        if (!currentLowest || price.price < currentLowest.price) {
          uniquePricesByMarketplace.set(slug, price as MarketplacePrice);
        }
      }

      // Log summary of unique prices
      console.debug(
        `Returning ${uniquePricesByMarketplace.size} unique marketplace prices for ${ingredient}:`,
        {
          marketplaces: Array.from(uniquePricesByMarketplace.keys()),
          originalCount: allPricesUnsorted.length,
        },
      );

      // Convert back to array
      const allPrices = Array.from(uniquePricesByMarketplace.values());

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
