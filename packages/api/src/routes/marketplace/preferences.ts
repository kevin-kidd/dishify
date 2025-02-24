import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { UserMarketplacePreferencesTable } from "../../db/schema/marketplace";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { RegionSchema, MarketplaceSlugSchema } from "../../../schemas/marketplace";
import { getMarketplacesByRegion } from "./registry";
import { tryCatch } from "@dishify/app/utils/helpers";

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
      const { data: preferences, error: preferencesError } = await tryCatch(
        db
          .select()
          .from(UserMarketplacePreferencesTable)
          .where(eq(UserMarketplacePreferencesTable.userId, user.id))
          .all(),
      );

      if (preferencesError) {
        console.error("Failed to fetch user marketplace preferences:", {
          error: preferencesError.message,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch marketplace preferences",
        });
      }

      return {
        marketplaces: marketplaces.map((m) => ({
          ...m,
          isPreferred: preferences?.some((p) => p.marketplaceSlug === m.slug) || false,
          preferenceOrder: preferences?.find((p) => p.marketplaceSlug === m.slug)?.order ?? null,
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
      const { error: deleteError } = await tryCatch(
        db
          .delete(UserMarketplacePreferencesTable)
          .where(eq(UserMarketplacePreferencesTable.userId, user.id)),
      );

      if (deleteError) {
        console.error("Failed to delete existing marketplace preferences:", {
          error: deleteError.message,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update marketplace preferences",
        });
      }

      // Insert new preferences
      if (input.preferences.length > 0) {
        const { error: insertError } = await tryCatch(
          db.insert(UserMarketplacePreferencesTable).values(
            input.preferences.map((p) => ({
              userId: user.id,
              marketplaceSlug: p.marketplaceSlug,
              order: p.order,
              region: input.region, // Store the region with the preference
            })),
          ),
        );

        if (insertError) {
          console.error("Failed to insert new marketplace preferences:", {
            error: insertError.message,
            userId: user.id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update marketplace preferences",
          });
        }
      }

      return {
        success: true,
        region: input.region,
      };
    }),
});
