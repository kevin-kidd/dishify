import type { z } from "zod";
import type { RegionSchema } from "../../../schemas/marketplace";

// Base marketplace types
export type Region = z.infer<typeof RegionSchema>;

// Serper API response type
export interface SerperShoppingResponse {
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

// Price response types
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

// Error types
export type MarketplaceErrorCode =
  | "RATE_LIMIT"
  | "API_ERROR"
  | "REGION_NOT_SUPPORTED"
  | "ITEM_NOT_FOUND"
  | "VALIDATION_ERROR";

export class MarketplaceError extends Error {
  constructor(
    message: string,
    public readonly code: MarketplaceErrorCode,
    public readonly marketplace: string,
  ) {
    super(message);
    this.name = "MarketplaceError";
  }
}

// User preferences types
export interface MarketplacePreference {
  marketplaceSlug: string;
  region: Region;
  order: number;
}

// Response types
export interface GetIngredientPriceResponse {
  prices: MarketplacePrice[];
  region: Region;
}
