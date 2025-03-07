import React from "react";
import { View } from "react-native";
import { Text } from "@dishify/ui";
import { DollarSign } from "lucide-react";

// Define the EstimatedCosts type
type EstimatedCostData = {
  cost: number;
  updatedAt: string;
  missingIngredientsCount: number;
  totalIngredientsCount: number;
};

type EstimatedCosts = {
  [region: string]: EstimatedCostData;
};

// Helper function to format price
export function formatPrice(cents: number, currency = "USD") {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(cents / 100);
}

// Function to generate cost indicators based on estimatedCosts
export function getCostIndicators(estimatedCosts: EstimatedCosts | null | undefined) {
  if (!estimatedCosts) {
    return null;
  }

  // Get the first region's cost data (or use a specific region if needed)
  const regions = Object.keys(estimatedCosts);
  if (!regions || regions.length === 0) {
    return null;
  }

  // Try to find a region with valid cost data
  let validRegion: string | undefined;
  let validCostData: EstimatedCostData | undefined;

  for (const region of regions) {
    const costData = estimatedCosts[region];
    if (costData && typeof costData.cost === "number") {
      validRegion = region;
      validCostData = costData;
      break;
    }
  }

  if (!validRegion || !validCostData) {
    return null;
  }

  // Determine number of dollar signs based on cost
  const cost = validCostData.cost;

  // If cost is 0, it's likely a placeholder value
  // Use a default of 2 dollar signs (medium cost)
  if (cost === 0) {
    const dollarSigns = Array.from({ length: 2 }, (_, i) => `default-${i}`);

    return (
      <View className="flex flex-row items-center gap-1">
        {dollarSigns.map((key) => (
          <DollarSign key={key} className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />
        ))}
      </View>
    );
  }

  // If cost is negative, don't show any indicators
  if (cost < 0) {
    return null;
  }

  const count = cost > 10000 ? 4 : cost > 5000 ? 3 : cost > 2500 ? 2 : 1;

  // Create stable keys for dollar signs
  const dollarSigns = Array.from({ length: count }, (_, i) => `${cost}-${i}`);

  return (
    <View className="flex flex-row items-center gap-1">
      {dollarSigns.map((key) => (
        <DollarSign key={key} className="h-4 w-4 text-[#13a300]" strokeWidth={2.5} />
      ))}
    </View>
  );
}
