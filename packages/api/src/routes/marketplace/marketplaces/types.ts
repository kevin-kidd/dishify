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
export type Region = z.infer<typeof RegionSchema>;

// Base price response
export interface MarketplacePrice {
  price: number; // Price in smallest currency unit (cents, pence, etc)
  url: string;
  currency: string; // ISO 4217 currency code
  unit: string; // Unit of measurement (e.g., oz, lb, unit)
  marketplaceName: string; // Name of the marketplace (e.g., "Walmart", "Amazon")
  marketplaceLogo: string; // URL to the marketplace logo
  marketplaceSlug: string; // Unique identifier for the marketplace
  title: string; // Product title for AI matching
}

// Error types specific to marketplace integrations
export class MarketplaceError extends Error {
  constructor(
    message: string,
    public readonly code: "RATE_LIMIT" | "API_ERROR" | "REGION_NOT_SUPPORTED" | "ITEM_NOT_FOUND",
    public readonly marketplace: string,
  ) {
    super(message);
    this.name = "MarketplaceError";
  }
}

// Schema for Serper API response
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
