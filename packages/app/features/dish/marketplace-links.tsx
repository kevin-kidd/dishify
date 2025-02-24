import React, { useState } from "react";
import { View, Platform, Image as RNImage } from "react-native";
import { Text, Popover, PopoverTrigger, PopoverContent, Button } from "@dishify/ui";
import { ExternalLink } from "@dishify/ui/src/icons/external-link";
import { ShoppingCart } from "@dishify/ui/src/icons/shopping-cart";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { MarketplacePrice } from "./types";
import { formatPrice } from "app/utils/currency";
import { MarketplaceLinksSkeleton } from "./marketplace-links-skeleton";

type MarketplaceLinksProps = {
  prices?: MarketplacePrice[];
  isLoading?: boolean;
};

// Helper function to ensure consistent image rendering across platforms
const MarketplaceLogo = ({ uri, size, alt }: { uri: string; size: number; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  // Check if the URI is valid
  const isValidUrl = uri && (uri.startsWith("http://") || uri.startsWith("https://"));

  if (hasError || !isValidUrl) {
    return (
      <View
        className="flex items-center justify-center bg-sage-100 rounded-sm"
        style={{ width: size, height: size }}
      >
        <ShoppingCart className="text-sage-500" style={{ width: size * 0.6, height: size * 0.6 }} />
      </View>
    );
  }

  // Use React Native's Image component for all platforms
  return (
    <View className="flex items-center justify-center" style={{ width: size, height: size }}>
      <RNImage
        source={{ uri }}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
          ...(Platform.OS === "web" ? { objectFit: "contain" } : {}),
        }}
        onError={() => setHasError(true)}
        accessibilityLabel={alt}
      />
    </View>
  );
};

export function MarketplaceLinks({ prices, isLoading = false }: MarketplaceLinksProps) {
  if (isLoading) {
    return <MarketplaceLinksSkeleton />;
  }

  if (!prices || !prices.length) {
    return null;
  }

  // Deduplicate prices by marketplace (keep only the lowest price for each marketplace)
  const uniquePrices = Array.from(
    prices
      .reduce((map, price) => {
        const existing = map.get(price.marketplaceSlug);
        if (!existing || price.price < existing.price) {
          map.set(price.marketplaceSlug, price);
        }
        return map;
      }, new Map<string, MarketplacePrice>())
      .values(),
  );

  // Always sort by price
  const sortedMarketplaces = [...uniquePrices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedMarketplaces[0]?.price ?? 0;
  const lowestPriceCurrency = sortedMarketplaces[0]?.currency ?? "USD";

  if (sortedMarketplaces.length === 1) {
    const marketplace = sortedMarketplaces[0];
    if (!marketplace) return null;

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Button
          variant="none"
          className="group flex flex-row items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/95 hover:bg-sage-50/95 active:bg-sage-100/95 ring-1 ring-sage-100/90 transition-colors duration-200"
          onClick={() => {
            window.open(marketplace.url, "_blank");
          }}
        >
          <View className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-sage-100/90 flex items-center justify-center sm:w-[26px] sm:h-[26px] w-[22px] h-[22px]">
            <MarketplaceLogo
              uri={marketplace.marketplaceLogo}
              size={18}
              alt={`${marketplace.marketplaceName} logo`}
            />
          </View>
          <Text className="text-[12px] sm:text-[13px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
            {formatPrice(marketplace.price, marketplace.currency)}
          </Text>
          <ExternalLink className="h-3 w-3 text-sage-400 group-hover:text-sage-500 transition-colors duration-200" />
        </Button>
      </Animated.View>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="none"
          className="group flex flex-row items-center gap-2.5 rounded-xl transition-colors duration-200 animate-fade-in"
        >
          <View className="flex flex-row items-center">
            {sortedMarketplaces.slice(0, 3).map((marketplace, index) => (
              <View
                key={marketplace.marketplaceSlug}
                className="relative first:ml-0 -ml-2.5"
                style={{
                  zIndex: sortedMarketplaces.length - index,
                }}
              >
                <View
                  className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-white flex items-center justify-center sm:w-[30px] sm:h-[30px] w-[26px] h-[26px]"
                  style={Platform.select({
                    web:
                      Platform.OS === "web"
                        ? ({
                            WebkitFilter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.03))",
                            filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.03))",
                          } as any)
                        : undefined,
                  })}
                >
                  <MarketplaceLogo
                    uri={marketplace.marketplaceLogo}
                    size={22}
                    alt={`${marketplace.marketplaceName} logo`}
                  />
                </View>
              </View>
            ))}
          </View>
          <View className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-sage-50/95 active:bg-sage-100/95 ring-1 ring-sage-100/90 transition-colors duration-200">
            <Text className="text-[11px] sm:text-[12px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
              From {formatPrice(lowestPrice, lowestPriceCurrency)}
            </Text>
          </View>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[19rem] p-0 overflow-hidden rounded-xl bg-white/95 shadow-lg ring-1 ring-sage-100/90 animate-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        sideOffset={8}
      >
        <View className="px-3.5 py-3 border-b border-sage-100/90 bg-sage-50/50">
          <Text className="text-[13px] font-medium text-sage-800">Available from:</Text>
        </View>
        <View className="p-1.5">
          {sortedMarketplaces.map((marketplace) => (
            <Button
              variant="none"
              key={marketplace.marketplaceSlug}
              className="group w-full flex flex-row items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-sage-50/90 active:bg-sage-100/90 transition-colors duration-200"
              onClick={() => {
                window.open(marketplace.url, "_blank");
              }}
            >
              <View className="flex flex-row items-center gap-2.5">
                <View className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-sage-100/90 flex items-center justify-center w-[40px] h-[40px]">
                  <MarketplaceLogo
                    uri={marketplace.marketplaceLogo}
                    size={32}
                    alt={`${marketplace.marketplaceName} logo`}
                  />
                </View>
                <View>
                  <Text className="text-[13px] font-medium text-sage-900">
                    {marketplace.marketplaceName}
                  </Text>
                  <Text className="text-xs text-sage-500">Free shipping available</Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Text className="text-[13px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
                  {formatPrice(marketplace.price, marketplace.currency)}
                </Text>
                <ExternalLink className="h-3 w-3 text-sage-400 group-hover:text-sage-500 transition-colors duration-200" />
              </View>
            </Button>
          ))}
        </View>
      </PopoverContent>
    </Popover>
  );
}
