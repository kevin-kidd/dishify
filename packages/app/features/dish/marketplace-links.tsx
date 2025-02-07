import React from "react";
import { View, Image, Platform, Pressable } from "react-native";
import { Text, Popover, PopoverTrigger, PopoverContent, Button } from "@dishify/ui";
import { ExternalLink } from "@dishify/ui/src/icons/external-link";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type Marketplace = {
  name: string;
  logo: string;
  price: number;
  url: string;
};

type MarketplaceLinksProps = {
  ingredient: string;
  marketplaces: Marketplace[];
};

export function MarketplaceLinks({ ingredient, marketplaces }: MarketplaceLinksProps) {
  if (!marketplaces?.length) {
    return null;
  }

  // Always sort by price and limit to 3 lowest prices
  const sortedMarketplaces = [...marketplaces]
    .sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0))
    .slice(0, 3);

  const lowestPrice = sortedMarketplaces[0]?.price ?? 0;

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
          <View className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-sage-100/90">
            <Image
              source={{ uri: marketplace.logo }}
              className="sm:h-[22px] sm:w-[22px] w-[18px] h-[18px] p-0.5"
              alt={`${marketplace.name} logo`}
              style={Platform.select({
                web: {
                  objectFit: "contain",
                },
              })}
            />
          </View>
          <Text className="text-[12px] sm:text-[13px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
            ${marketplace.price.toFixed(2)}
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
            {sortedMarketplaces.map((marketplace, index) => (
              <View
                key={marketplace.name}
                className="relative first:ml-0 -ml-2.5"
                style={{
                  zIndex: sortedMarketplaces.length - index,
                }}
              >
                <View
                  className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-white"
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
                  <Image
                    source={{ uri: marketplace.logo }}
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0.5"
                    alt={`${marketplace.name} logo`}
                    style={Platform.select({
                      web: {
                        objectFit: "contain",
                      },
                    })}
                  />
                </View>
              </View>
            ))}
          </View>
          <View className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-sage-50/95 active:bg-sage-100/95 ring-1 ring-sage-100/90 transition-colors duration-200">
            <Text className="text-[11px] sm:text-[12px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
              From ${lowestPrice.toFixed(2)}
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
              key={marketplace.name}
              className="group w-full flex flex-row items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-sage-50/90 active:bg-sage-100/90 transition-colors duration-200"
              onClick={() => {
                window.open(marketplace.url, "_blank");
              }}
            >
              <View className="flex flex-row items-center gap-2.5">
                <View className="rounded-lg overflow-hidden bg-gradient-to-br from-sage-50/90 to-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-sage-100/90">
                  <Image
                    source={{ uri: marketplace.logo }}
                    className="h-9 w-9 p-0.5"
                    alt={`${marketplace.name} logo`}
                    style={Platform.select({
                      web: {
                        objectFit: "contain",
                      },
                    })}
                  />
                </View>
                <View>
                  <Text className="text-[13px] font-medium text-sage-900">{marketplace.name}</Text>
                  <Text className="text-xs text-sage-500">Free shipping available</Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Text className="text-[13px] font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
                  ${marketplace.price.toFixed(2)}
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
