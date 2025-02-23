import { z } from "zod";

// Supported regions
export const RegionSchema = z.enum([
  "US",
  "CA",
  "UK",
  "DE",
  "FR",
  "IT",
  "ES",
  "MX",
  "BE",
  "PL",
  "AU",
  "BR",
  "NL",
  "SG",
  "AE",
  "SA",
  "IN",
  "TR",
  "JP",
  "EG",
  "ZA",
]);

// Schema for single ingredient price response
export const IngredientPriceResponseSchema = z.object({
  prices: z.array(
    z.object({
      price: z.number(), // Price in cents
      url: z.string(),
      currency: z.string(),
      unit: z.string(),
      marketplaceName: z.string(),
      marketplaceLogo: z.string().optional(),
      marketplaceSlug: z.string(),
      title: z.string(),
    }),
  ),
});

export const SerperShoppingResponseSchema = z.object({
  prices: z.array(
    z.object({
      price: z.number(), // Price in cents
      url: z.string(),
      currency: z.string(),
      unit: z.string(),
      marketplaceName: z.string(),
      marketplaceLogo: z.string(),
      marketplaceSlug: z.string(),
      title: z.string(),
    }),
  ),
});

// Create a Zod schema for marketplace slugs
export const MarketplaceSlugSchema = z.enum(["walmart", "amazon"]);
