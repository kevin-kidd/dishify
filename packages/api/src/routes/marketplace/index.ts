import { router } from "../../trpc";
import { getIngredientPrice } from "./prices";
import { marketplacePreferencesRouter } from "./preferences";

export const marketplaceRouter = router({
  getIngredientPrice,
  preferences: marketplacePreferencesRouter,
});

export type MarketplaceRouter = typeof marketplaceRouter;
