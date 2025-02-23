import type { SerperShoppingResponse } from "./types";

// Function to fetch price from Serper API for a single ingredient
export async function fetchSerperPrice(
  ingredient: { item: string; quantity: string },
  location: string,
  apiKey: string,
): Promise<SerperShoppingResponse> {
  const SERPER_API_URL = "https://google.serper.dev/shopping";

  const res = await fetch(SERPER_API_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `${ingredient.item} ${ingredient.quantity}`,
      gl: location.toLowerCase(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Serper API error: ${res.statusText}`);
  }

  return res.json() as Promise<SerperShoppingResponse>;
}
