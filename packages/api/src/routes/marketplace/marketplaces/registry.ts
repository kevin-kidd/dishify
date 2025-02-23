import type { Region } from "./types";

// Registry of marketplace metadata
export const marketplaceRegistry = {
  // United States & Canada
  walmart: {
    name: "Walmart",
    slug: "walmart",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Walmart_App_icon_%282025%29.svg",
    supportedRegions: ["US", "CA", "MX"] as const,
    defaultCurrency: {
      US: "USD",
      CA: "CAD",
      MX: "MXN",
    },
  },
  amazon: {
    name: "Amazon",
    slug: "amazon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
    supportedRegions: [
      "US",
      "CA",
      "UK",
      "DE",
      "FR",
      "IT",
      "ES",
      "MX",
      "BR",
      "NL",
      "SG",
      "AE",
      "SA",
      "IN",
      "TR",
      "JP",
      "AU",
    ] as const,
    defaultCurrency: {
      US: "USD",
      CA: "CAD",
      UK: "GBP",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      MX: "MXN",
      BR: "BRL",
      NL: "EUR",
      SG: "SGD",
      AE: "AED",
      SA: "SAR",
      IN: "INR",
      TR: "TRY",
      JP: "JPY",
      AU: "AUD",
    },
  },
  target: {
    name: "Target",
    slug: "target",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Target_Corporation_logo_%28vector%29.svg",
    supportedRegions: ["US"] as const,
    defaultCurrency: {
      US: "USD",
    },
  },
  kroger: {
    name: "Kroger",
    slug: "kroger",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Kroger_logo_%281961-2019%29.svg",
    supportedRegions: ["US"] as const,
    defaultCurrency: {
      US: "USD",
    },
  },
  costco: {
    name: "Costco",
    slug: "costco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg",
    supportedRegions: ["US", "CA"] as const,
    defaultCurrency: {
      US: "USD",
      CA: "CAD",
    },
  },
  safeway: {
    name: "Safeway",
    slug: "safeway",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Safeway_Logo.svg",
    supportedRegions: ["US", "CA"] as const,
    defaultCurrency: {
      US: "USD",
      CA: "CAD",
    },
  },
  wholefoods: {
    name: "Whole Foods",
    slug: "wholefoods",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Whole_Foods_Market_201x_logo.svg",
    supportedRegions: ["US", "CA"] as const,
    defaultCurrency: {
      US: "USD",
      CA: "CAD",
    },
  },
  // Canadian Stores
  metro: {
    name: "Metro",
    slug: "metro",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Metro_Inc._logo.svg",
    supportedRegions: ["CA"] as const,
    defaultCurrency: {
      CA: "CAD",
    },
  },
  loblaws: {
    name: "Loblaws",
    slug: "loblaws",
    logo: "https://upload.wikimedia.org/wikipedia/en/e/e2/Loblaws.svg",
    supportedRegions: ["CA"] as const,
    defaultCurrency: {
      CA: "CAD",
    },
  },
  freshco: {
    name: "FreshCo",
    slug: "freshco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/FreshCo_logo.svg",
    supportedRegions: ["CA"] as const,
    defaultCurrency: {
      CA: "CAD",
    },
  },
  superstore: {
    name: "Real Canadian Superstore",
    slug: "superstore",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/30/President%27s_Choice_Logo_2014.svg",
    supportedRegions: ["CA"] as const,
    defaultCurrency: {
      CA: "CAD",
    },
  },
  // Rest of World
  tesco: {
    name: "Tesco",
    slug: "tesco",
    logo: "https://upload.wikimedia.org/wikipedia/en/b/b0/Tesco_Logo.svg",
    supportedRegions: ["UK"] as const,
    defaultCurrency: {
      UK: "GBP",
    },
  },
  sainsburys: {
    name: "Sainsbury's",
    slug: "sainsburys",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Sainsbury%27s_logo.png",
    supportedRegions: ["UK"] as const,
    defaultCurrency: {
      UK: "GBP",
    },
  },
  carrefour: {
    name: "Carrefour",
    slug: "carrefour",
    logo: "https://en.wikipedia.org/wiki/Carrefour#/media/File:Carrefour_logo_no_tag.svg",
    supportedRegions: ["FR", "ES", "IT", "BE", "PL", "BR", "AE", "SA"] as const,
    defaultCurrency: {
      FR: "EUR",
      ES: "EUR",
      IT: "EUR",
      BE: "EUR",
      PL: "PLN",
      BR: "BRL",
      AE: "AED",
      SA: "SAR",
    },
  },
  aldi: {
    name: "ALDI",
    slug: "aldi",
    logo: "https://en.wikipedia.org/wiki/Aldi#/media/File:ALDI_SUD.svg",
    supportedRegions: ["US", "UK", "DE", "FR", "IT", "ES", "AU"] as const,
    defaultCurrency: {
      US: "USD",
      UK: "GBP",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      AU: "AUD",
    },
  },
  lidl: {
    name: "Lidl",
    slug: "lidl",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg",
    supportedRegions: ["UK", "DE", "FR", "IT", "ES", "PL", "BE", "NL"] as const,
    defaultCurrency: {
      UK: "GBP",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      PL: "PLN",
      BE: "EUR",
      NL: "EUR",
    },
  },
  rewe: {
    name: "REWE",
    slug: "rewe",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_REWE.svg",
    supportedRegions: ["DE"] as const,
    defaultCurrency: {
      DE: "EUR",
    },
  },
  coles: {
    name: "Coles",
    slug: "coles",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/28/Coles_logo.svg",
    supportedRegions: ["AU"] as const,
    defaultCurrency: {
      AU: "AUD",
    },
  },
  woolworths: {
    name: "Woolworths",
    slug: "woolworths",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/64/Woolworth_Logo.svg",
    supportedRegions: ["AU"] as const,
    defaultCurrency: {
      AU: "AUD",
    },
  },
  bigbasket: {
    name: "BigBasket",
    slug: "bigbasket",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/BigBasket_Logo.png",
    supportedRegions: ["IN"] as const,
    defaultCurrency: {
      IN: "INR",
    },
  },
  rakuten: {
    name: "Rakuten",
    slug: "rakuten",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Rakuten_Global_Brand_Logo.svg",
    supportedRegions: ["JP"] as const,
    defaultCurrency: {
      JP: "JPY",
    },
  },
} as const;

export type MarketplaceSlug = keyof typeof marketplaceRegistry;

export function getMarketplacesByRegion(region: Region) {
  return Object.values(marketplaceRegistry).filter((marketplace) =>
    (marketplace.supportedRegions as readonly string[]).includes(region),
  );
}
