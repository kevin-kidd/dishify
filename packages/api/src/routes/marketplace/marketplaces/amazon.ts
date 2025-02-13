import type { Env } from "../../../types";
import type { MarketplaceIntegration, MarketplacePrice, Region } from "./types";
import { MarketplaceError } from "./types";

const SUPPORTED_REGIONS = [
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
] as const;
type AmazonRegion = (typeof SUPPORTED_REGIONS)[number];

const AMAZON_CONFIG = {
  name: "Amazon",
  slug: "amazon",
  logo: "/marketplaces/amazon.png",
  supportedRegions: SUPPORTED_REGIONS,
  defaultCurrency: {
    US: "USD", // United States
    CA: "CAD", // Canada
    UK: "GBP", // United Kingdom
    DE: "EUR", // Germany
    FR: "EUR", // France
    IT: "EUR", // Italy
    ES: "EUR", // Spain
    MX: "MXN", // Mexico
    BE: "EUR", // Belgium
    PL: "PLN", // Poland
    AU: "AUD", // Australia
    BR: "BRL", // Brazil
    NL: "EUR", // Netherlands
    SG: "SGD", // Singapore
    AE: "AED", // United Arab Emirates
    SA: "SAR", // Saudi Arabia
    IN: "INR", // India
    TR: "TRY", // Turkey
    JP: "JPY", // Japan
    EG: "EGP", // Egypt
    ZA: "ZAR", // South Africa
  } as const,
  baseUrl: {
    US: "https://www.amazon.com",
    CA: "https://www.amazon.ca",
    UK: "https://www.amazon.co.uk",
    DE: "https://www.amazon.de",
    FR: "https://www.amazon.fr",
    IT: "https://www.amazon.it",
    ES: "https://www.amazon.es",
    MX: "https://www.amazon.com.mx",
    BE: "https://www.amazon.com.be",
    PL: "https://www.amazon.pl",
    AU: "https://www.amazon.com.au",
    BR: "https://www.amazon.com.br",
    NL: "https://www.amazon.nl",
    SG: "https://www.amazon.sg",
    AE: "https://www.amazon.ae",
    SA: "https://www.amazon.sa",
    IN: "https://www.amazon.in",
    TR: "https://www.amazon.com.tr",
    JP: "https://www.amazon.co.jp",
    EG: "https://www.amazon.eg",
    ZA: "https://www.amazon.com.za",
  } as const,
} as const;

interface AmazonSearchResponse {
  totalResultsCount: number;
  currency: string;
  details: Array<{
    ProductTitle: string;
    asin: string;
    price: string;
    discount: string;
    originalPrice: string;
    productUrl: string;
  }>;
}

export class AmazonMarketplace implements MarketplaceIntegration<typeof SUPPORTED_REGIONS> {
  readonly config = AMAZON_CONFIG;

  getCurrencyForRegion(region: Region): string | undefined {
    return this.config.supportedRegions.includes(region as AmazonRegion)
      ? this.config.defaultCurrency[region as AmazonRegion]
      : undefined;
  }

  async searchIngredient(
    ingredient: string,
    region: Region,
    env: Env,
  ): Promise<MarketplacePrice[]> {
    if (!this.config.supportedRegions.includes(region as AmazonRegion)) {
      console.warn(`[Amazon API] Region ${region} not supported`);
      throw new MarketplaceError(
        `Amazon is not supported in ${region}`,
        "REGION_NOT_SUPPORTED",
        "amazon",
      );
    }

    // Check required environment variables
    if (!env.RAPID_API_KEY) {
      console.error("[Amazon API] Missing required environment variables");
      throw new MarketplaceError("Missing Amazon API credentials", "API_ERROR", "amazon");
    }

    const encodedQuery = encodeURIComponent(ingredient);
    // Convert region to lowercase for the API
    const country = region.toLowerCase();
    const url = `https://realtime-amazon-data.p.rapidapi.com/product-search?keyword=${encodedQuery}&country=${country}&page=1&sort=Featured`;

    try {
      const response = await fetch(url, {
        headers: {
          "x-rapidapi-key": env.RAPID_API_KEY,
          "x-rapidapi-host": "realtime-amazon-data.p.rapidapi.com",
        },
        // Add cache-control headers for Cloudflare caching
        cf: {
          cacheTtl: 3600, // Cache for 1 hour
          cacheEverything: true,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("[Amazon API] Rate limit exceeded");
          throw new MarketplaceError("Rate limit exceeded for Amazon API", "RATE_LIMIT", "amazon");
        }

        // Log the error response body if possible
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error("[Amazon API] Error response body:", errorBody);
        } catch (e) {
          console.error("[Amazon API] Could not read error response body");
        }

        throw new MarketplaceError(
          `Amazon API error: ${response.statusText} (${errorBody})`,
          "API_ERROR",
          "amazon",
        );
      }

      const data = (await response.json()) as AmazonSearchResponse;

      if (!data.details?.length) {
        console.warn(`[Amazon API] No results found for ingredient: "${ingredient}"`);
        throw new MarketplaceError(
          `No results found for ${ingredient}`,
          "ITEM_NOT_FOUND",
          "amazon",
        );
      }

      // Take up to first 5 results
      const items = data.details.slice(0, 5);

      return items.map((item) => {
        // Convert price string to cents (remove currency symbol and convert to number)
        const priceInCents = Math.round(
          Number.parseFloat(item.price.replace(/[^0-9.]/g, "")) * 100,
        );

        return {
          price: priceInCents,
          url: item.productUrl,
          currency: this.config.defaultCurrency[region],
          unit: "unit", // Amazon API doesn't provide unit information
          marketplaceName: this.config.name,
          marketplaceLogo: this.config.logo,
          marketplaceSlug: this.config.slug,
          title: item.ProductTitle, // Add title for AI matching
        };
      });
    } catch (error) {
      if (error instanceof MarketplaceError) {
        throw error;
      }
      console.error(`[Amazon API] Error searching for ingredient "${ingredient}":`, error);
      throw new MarketplaceError(
        `Failed to search for ${ingredient}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        "amazon",
      );
    }
  }
}
