import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { UserMarketplacePreferencesTable } from "../../db/schema/marketplace";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { RegionSchema, MarketplaceSlugSchema } from "../../../schemas/marketplace";
import { getMarketplacesByRegion } from "./registry";

export const marketplacePreferencesRouter = router({
  // Get all available marketplaces and user's preferences
  getAvailableMarketplaces: protectedProcedure
    .input(
      z.object({
        region: RegionSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // If no region is specified, use the user's detected region from Cloudflare
      // or default to US if not available
      const detectedRegion = ctx.cf?.country;
      const region = (input.region ?? detectedRegion ?? "US") as z.infer<typeof RegionSchema>;

      // Get all active marketplaces from registry
      const marketplaces = getMarketplacesByRegion(region);

      // Get user's preferences
      const preferences = await db
        .select()
        .from(UserMarketplacePreferencesTable)
        .where(eq(UserMarketplacePreferencesTable.userId, user.id))
        .all();

      return {
        marketplaces: marketplaces.map((m) => ({
          ...m,
          isPreferred: preferences.some((p) => p.marketplaceSlug === m.slug),
          preferenceOrder: preferences.find((p) => p.marketplaceSlug === m.slug)?.order ?? null,
        })),
        region,
      };
    }),

  // Update user's marketplace preferences and region
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferences: z.array(
          z.object({
            marketplaceSlug: MarketplaceSlugSchema,
            order: z.number(),
          }),
        ),
        region: RegionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Verify all marketplaces exist and are active in the specified region
      const availableMarketplaces = getMarketplacesByRegion(input.region);
      const validSlugs = new Set(availableMarketplaces.map((m) => m.slug));

      if (!input.preferences.every((p) => validSlugs.has(p.marketplaceSlug))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more marketplaces are invalid or inactive for the specified region",
        });
      }

      // Delete existing preferences
      await db
        .delete(UserMarketplacePreferencesTable)
        .where(eq(UserMarketplacePreferencesTable.userId, user.id));

      // Insert new preferences
      if (input.preferences.length > 0) {
        await db.insert(UserMarketplacePreferencesTable).values(
          input.preferences.map((p) => ({
            userId: user.id,
            marketplaceSlug: p.marketplaceSlug,
            order: p.order,
            region: input.region, // Store the region with the preference
          })),
        );
      }

      return {
        success: true,
        region: input.region,
      };
    }),
});
