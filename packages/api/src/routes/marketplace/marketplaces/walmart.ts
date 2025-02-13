import type { Env } from "../../../types";
import type { MarketplaceIntegration, MarketplacePrice, Region } from "./types";
import { MarketplaceError } from "./types";

const SUPPORTED_REGIONS = ["US"] as const;
type WalmartRegion = (typeof SUPPORTED_REGIONS)[number];

const WALMART_CONFIG = {
  name: "Walmart",
  slug: "walmart",
  logo: "/marketplaces/walmart.svg",
  supportedRegions: SUPPORTED_REGIONS,
  defaultCurrency: {
    US: "USD",
  } as const,
  baseUrl: {
    US: "https://www.walmart.com",
  } as const,
} as const;

interface WalmartSearchResponse {
  items: Array<{
    itemId: string;
    name: string;
    salePrice: number;
    productUrl: string;
    size?: string;
    unit?: string;
  }>;
}

export class WalmartMarketplace implements MarketplaceIntegration<typeof SUPPORTED_REGIONS> {
  readonly config = WALMART_CONFIG;

  getCurrencyForRegion(region: Region): string | undefined {
    return this.config.supportedRegions.includes(region as WalmartRegion)
      ? this.config.defaultCurrency[region as WalmartRegion]
      : undefined;
  }

  private async importPrivateKey(pemKey: string): Promise<CryptoKey> {
    try {
      // Remove PEM headers and newlines to get base64
      const pemHeader = "-----BEGIN PRIVATE KEY-----";
      const pemFooter = "-----END PRIVATE KEY-----";
      const pemContents = pemKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");

      // Convert base64 to binary
      const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

      // Import the key
      return crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        false,
        ["sign"],
      );
    } catch (error) {
      console.error("[Walmart API] Error importing private key:", error);
      throw new MarketplaceError(
        `Failed to import private key: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        "walmart",
      );
    }
  }

  private async generateSignature(
    headers: Record<string, string>,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      // Sort headers by key (case-sensitive sort as per Walmart docs)
      const sortedHeaders = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));

      // Create canonical string with trailing newlines (exactly as Java does)
      const canonicalString = sortedHeaders.map(([_, value]) => `${value.trim()}\n`).join("");

      // Import the private key
      const privateKey = await this.importPrivateKey(privateKeyPem);

      // Create signature using Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(canonicalString);
      const signature = await crypto.subtle.sign(
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" },
        },
        privateKey,
        data,
      );

      // Convert to base64
      const signatureArray = new Uint8Array(signature);
      return btoa(String.fromCharCode(...signatureArray));
    } catch (error) {
      console.error("[Walmart API] Error generating signature:", error);
      throw new MarketplaceError(
        `Failed to generate signature: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        "walmart",
      );
    }
  }

  private async makeRequest(
    endpoint: string,
    region: WalmartRegion,
    env: Env,
  ): Promise<WalmartSearchResponse> {
    const baseApiUrl = "https://developer.api.walmart.com/api-proxy/service/affil/product/v2";
    const url = `${baseApiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Check required environment variables
    if (!env.WALMART_CONSUMER_ID || !env.WALMART_PRIVATE_KEY) {
      console.error("[Walmart API] Missing required environment variables");
      throw new MarketplaceError("Missing Walmart API credentials", "API_ERROR", "walmart");
    }

    // Create headers in the exact order Walmart expects
    const headersToSign = {
      "WM_CONSUMER.ID": env.WALMART_CONSUMER_ID.trim(),
      "WM_CONSUMER.INTIMESTAMP": Date.now().toString().trim(),
      "WM_SEC.KEY_VERSION": "1",
    };

    try {
      const signature = await this.generateSignature(headersToSign, env.WALMART_PRIVATE_KEY);

      // Combine all headers
      const headers = {
        ...headersToSign,
        "WM_SEC.AUTH_SIGNATURE": signature,
        Accept: "application/json",
      };

      const response = await fetch(url, {
        headers,
        // Add cache-control headers for Cloudflare caching
        cf: {
          cacheTtl: 3600, // Cache for 1 hour
          cacheEverything: true,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("[Walmart API] Rate limit exceeded");
          throw new MarketplaceError(
            "Rate limit exceeded for Walmart API",
            "RATE_LIMIT",
            "walmart",
          );
        }

        // Log the error response body if possible
        let errorBody = "";
        try {
          errorBody = await response.text();
          console.error("[Walmart API] Error response body:", errorBody);
        } catch (e) {
          console.error("[Walmart API] Could not read error response body");
        }

        throw new MarketplaceError(
          `Walmart API error: ${response.statusText} (${errorBody})`,
          "API_ERROR",
          "walmart",
        );
      }

      const data = (await response.json()) as WalmartSearchResponse;
      return data;
    } catch (error) {
      if (error instanceof MarketplaceError) {
        throw error;
      }
      console.error("[Walmart API] Request failed:", error);
      throw new MarketplaceError(
        `Walmart API request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        "walmart",
      );
    }
  }

  async searchIngredient(
    ingredient: string,
    region: Region,
    env: Env,
  ): Promise<MarketplacePrice[]> {
    if (!this.config.supportedRegions.includes(region as WalmartRegion)) {
      console.warn(`[Walmart API] Region ${region} not supported`);
      throw new MarketplaceError(
        `Walmart is not supported in ${region}`,
        "REGION_NOT_SUPPORTED",
        "walmart",
      );
    }

    // Check required environment variables
    if (!env.WALMART_CONSUMER_ID || !env.WALMART_PRIVATE_KEY) {
      console.error("[Walmart API] Missing required environment variables");
      throw new MarketplaceError("Missing Walmart API credentials", "API_ERROR", "walmart");
    }

    const endpoint = `/search?query=${encodeURIComponent(ingredient)}&numItems=5`;

    try {
      const data = await this.makeRequest(endpoint, region as WalmartRegion, env);

      if (!data.items?.length) {
        console.warn(`[Walmart API] No results found for ingredient: "${ingredient}"`);
        throw new MarketplaceError(
          `No results found for ${ingredient}`,
          "ITEM_NOT_FOUND",
          "walmart",
        );
      }

      return data.items.map((item) => {
        // Extract unit from size if available (e.g., "16 oz" -> "oz")
        let unit = "unit";
        if (item.size) {
          const match = item.size.match(/[a-zA-Z]+$/);
          if (match) {
            unit = match[0].toLowerCase();
          }
        }

        return {
          price: Math.round(item.salePrice * 100), // Convert to cents
          url: `${this.config.baseUrl[region as WalmartRegion]}/${item.itemId}`,
          currency: this.config.defaultCurrency[region as WalmartRegion],
          unit: item.unit || unit,
          marketplaceName: this.config.name,
          marketplaceLogo: this.config.logo,
          marketplaceSlug: this.config.slug,
          title: item.name, // Add title for AI matching
        };
      });
    } catch (error) {
      if (error instanceof MarketplaceError) {
        throw error;
      }
      console.error(`[Walmart API] Error searching for ingredient "${ingredient}":`, error);
      throw new MarketplaceError(
        `Failed to search for ${ingredient}: ${error instanceof Error ? error.message : "Unknown error"}`,
        "API_ERROR",
        "walmart",
      );
    }
  }
}
