import { z } from "zod";
import type { Env } from "../../../types";

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
  marketplaceName: string; // Name of the marketplace (e.g., "Walmart")
  marketplaceLogo: string; // URL to the marketplace logo
  marketplaceSlug: string; // Unique identifier for the marketplace
  title: string; // Product title for AI matching
}

// Configuration for marketplace availability
export interface MarketplaceConfig<
  TSupportedRegions extends readonly Region[] = readonly Region[],
> {
  name: string;
  slug: string;
  logo: string;
  supportedRegions: TSupportedRegions;
  defaultCurrency: { [K in TSupportedRegions[number]]: string };
  baseUrl: { [K in TSupportedRegions[number]]: string };
}

// Base marketplace integration interface
export interface MarketplaceIntegration<
  TSupportedRegions extends readonly Region[] = readonly Region[],
> {
  config: Readonly<MarketplaceConfig<TSupportedRegions>>;
  searchIngredient: (ingredient: string, region: Region, env: Env) => Promise<MarketplacePrice[]>;
  getCurrencyForRegion: (region: Region) => string | undefined;
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
