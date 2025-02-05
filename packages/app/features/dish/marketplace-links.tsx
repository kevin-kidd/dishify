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

  if (marketplaces.length === 1) {
    const marketplace = marketplaces[0];
    if (!marketplace) return null;

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Button
          variant="none"
          className="group flex flex-row items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-sage-50 active:bg-sage-100 ring-1 ring-sage-100 transition-all duration-200"
          onClick={() => {
            window.open(marketplace.url, "_blank");
          }}
        >
          <View className="rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-sage-100">
            <Image
              source={{ uri: marketplace.logo }}
              className="h-5 w-5"
              alt={`${marketplace.name} logo`}
              style={Platform.select({
                web: {
                  objectFit: "contain",
                },
              })}
            />
          </View>
          <Text className="text-sm font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
            ${marketplace.price.toFixed(2)}
          </Text>
          <ExternalLink className="h-3.5 w-3.5 text-sage-500 group-hover:text-sage-600 transition-colors duration-200" />
        </Button>
      </Animated.View>
    );
  }

  // Sort marketplaces by price
  const sortedMarketplaces = [...marketplaces].sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));
  const lowestPrice = sortedMarketplaces[0]?.price ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="none"
          className="group flex flex-row items-center gap-2 rounded-lg transition-all duration-200 animate-fade-in"
        >
          <View className="flex flex-row items-center">
            {sortedMarketplaces.slice(0, 3).map((marketplace, index) => (
              <View
                key={marketplace.name}
                className="relative first:ml-0 -ml-2"
                style={{
                  zIndex: sortedMarketplaces.length - index,
                }}
              >
                <View className="rounded-lg overflow-hidden bg-white shadow-sm ring-2 ring-white">
                  <Image
                    source={{ uri: marketplace.logo }}
                    className="h-6 w-6"
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
          <View className="px-3 py-1.5 rounded-lg bg-white hover:bg-sage-50 active:bg-sage-100 ring-1 ring-sage-100 transition-all duration-200">
            <Text className="text-sm font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
              From ${lowestPrice.toFixed(2)}
            </Text>
          </View>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-sage-100 animate-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        sideOffset={8}
      >
        <View className="p-3 border-b border-sage-100 bg-sage-50">
          <Text className="text-sm font-medium text-sage-800">Available from:</Text>
        </View>
        <View className="p-1.5">
          {sortedMarketplaces.map((marketplace) => (
            <Button
              variant="none"
              key={marketplace.name}
              className="group flex flex-row items-center justify-between gap-2 p-2 rounded-md hover:bg-sage-50 active:bg-sage-100 transition-colors duration-200"
              onClick={() => {
                window.open(marketplace.url, "_blank");
              }}
            >
              <View className="flex flex-row items-center gap-2.5">
                <View className="rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-sage-100">
                  <Image
                    source={{ uri: marketplace.logo }}
                    className="h-8 w-8"
                    alt={`${marketplace.name} logo`}
                    style={Platform.select({
                      web: {
                        objectFit: "contain",
                      },
                    })}
                  />
                </View>
                <View>
                  <Text className="text-sm font-medium text-sage-900">{marketplace.name}</Text>
                  <Text className="text-xs text-sage-600">Free shipping available</Text>
                </View>
              </View>
              <View className="flex flex-row items-center gap-1.5">
                <Text className="text-sm font-medium text-sage-700 group-hover:text-sage-800 transition-colors duration-200">
                  ${marketplace.price.toFixed(2)}
                </Text>
                <ExternalLink className="h-3.5 w-3.5 text-sage-500 group-hover:text-sage-600 transition-colors duration-200" />
              </View>
            </Button>
          ))}
        </View>
      </PopoverContent>
    </Popover>
  );
}
