import { router } from "../../trpc";
import { getMarketplacePrices } from "./prices";
import { marketplacePreferencesRouter } from "./preferences";

export const marketplaceRouter = router({
  getMarketplacePrices,
  preferences: marketplacePreferencesRouter,
});

export type MarketplaceRouter = typeof marketplaceRouter;
