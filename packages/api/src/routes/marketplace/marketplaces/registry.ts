import { WalmartMarketplace } from "./walmart";
import { AmazonMarketplace } from "./amazon";
import type { Region } from "./types";

// Registry of marketplace integrations
const marketplaceRegistry = {
  walmart: new WalmartMarketplace(),
  amazon: new AmazonMarketplace(),
} as const;

export type MarketplaceSlug = keyof typeof marketplaceRegistry;
type MarketplaceType<T extends MarketplaceSlug> = (typeof marketplaceRegistry)[T];

export function getMarketplace<T extends MarketplaceSlug>(slug: T): MarketplaceType<T> | undefined {
  return marketplaceRegistry[slug];
}

export function getAllMarketplaces(): (WalmartMarketplace | AmazonMarketplace)[] {
  return Object.values(marketplaceRegistry);
}

export function getMarketplacesByRegion(
  region: Region,
): (WalmartMarketplace | AmazonMarketplace)[] {
  return getAllMarketplaces().filter((marketplace) =>
    (marketplace.config.supportedRegions as readonly Region[]).includes(region),
  );
}
