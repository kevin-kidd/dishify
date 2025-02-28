/**
 * Food image utility for providing reliable images based on cuisine and dish types
 */

// Map of cuisines to high-quality food images
const cuisineImages: Record<string, string> = {
  italian:
    "https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=1000&auto=format&fit=crop",
  mexican:
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1000&auto=format&fit=crop",
  indian:
    "https://images.unsplash.com/photo-1585937421612-70a008356c36?q=80&w=1000&auto=format&fit=crop",
  chinese:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000&auto=format&fit=crop",
  japanese:
    "https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1000&auto=format&fit=crop",
  thai: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb9?q=80&w=1000&auto=format&fit=crop",
  french:
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1000&auto=format&fit=crop",
  mediterranean:
    "https://images.unsplash.com/photo-1544250965-67a1d89875fc?q=80&w=1000&auto=format&fit=crop",
  american:
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1000&auto=format&fit=crop",
  greek:
    "https://images.unsplash.com/photo-1604335398980-eeaa992fdca0?q=80&w=1000&auto=format&fit=crop",
  spanish:
    "https://images.unsplash.com/photo-1515443961218-a51367888e4b?q=80&w=1000&auto=format&fit=crop",
  korean:
    "https://images.unsplash.com/photo-1583592385692-1c2f85e87771?q=80&w=1000&auto=format&fit=crop",
  vietnamese:
    "https://images.unsplash.com/photo-1602030638412-bb8dcc0bc8b0?q=80&w=1000&auto=format&fit=crop",
  german:
    "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=1000&auto=format&fit=crop",
  british:
    "https://images.unsplash.com/photo-1608855238293-a8853e7f7c98?q=80&w=1000&auto=format&fit=crop",
  middle_eastern:
    "https://images.unsplash.com/photo-1559203244-e5ed46d95fda?q=80&w=1000&auto=format&fit=crop",
  turkish:
    "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=1000&auto=format&fit=crop",
  caribbean:
    "https://images.unsplash.com/photo-1628699265623-a333c9076a7c?q=80&w=1000&auto=format&fit=crop",
  southern:
    "https://images.unsplash.com/photo-1542574271-7f3b92e6c821?q=80&w=1000&auto=format&fit=crop",
  cajun:
    "https://images.unsplash.com/photo-1612438972941-c324f657a4b5?q=80&w=1000&auto=format&fit=crop",
  lebanese:
    "https://images.unsplash.com/photo-1577906096429-f73c2c312435?q=80&w=1000&auto=format&fit=crop",
  vegetarian:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop",
  vegan:
    "https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=1000&auto=format&fit=crop",
  seafood:
    "https://images.unsplash.com/photo-1579631542720-3a87824838d6?q=80&w=1000&auto=format&fit=crop",
  asian:
    "https://images.unsplash.com/photo-1541696490-8744a5dc0228?q=80&w=1000&auto=format&fit=crop",
  latin:
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1000&auto=format&fit=crop",
  african:
    "https://images.unsplash.com/photo-1571805341302-f857308690e3?q=80&w=1000&auto=format&fit=crop",
  fusion:
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop",
  nordic:
    "https://images.unsplash.com/photo-1515669097368-22e68427d265?q=80&w=1000&auto=format&fit=crop",
  russian:
    "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
  australian:
    "https://images.unsplash.com/photo-1599458252573-56ae36120de1?q=80&w=1000&auto=format&fit=crop",
  other:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop",
};

// Map of dish types to high-quality food images
const dishTypeImages: Record<string, string> = {
  pasta:
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1000&auto=format&fit=crop",
  pizza:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop",
  soup: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop",
  salad:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop",
  sandwich:
    "https://images.unsplash.com/photo-1553909489-cd47e0907980?q=80&w=1000&auto=format&fit=crop",
  curry:
    "https://images.unsplash.com/photo-1585937421612-70a008356c36?q=80&w=1000&auto=format&fit=crop",
  stew: "https://images.unsplash.com/photo-1608500218890-c4673070a0ef?q=80&w=1000&auto=format&fit=crop",
  beef_stew:
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1000&auto=format&fit=crop",
  hearty_beef_stew:
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1000&auto=format&fit=crop",
  risotto:
    "https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?q=80&w=1000&auto=format&fit=crop",
  rice: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=1000&auto=format&fit=crop",
  noodles:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1000&auto=format&fit=crop",
  burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop",
  taco: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1000&auto=format&fit=crop",
  sushi:
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
  fish: "https://images.unsplash.com/photo-1535140728325-a4d3707eee59?q=80&w=1000&auto=format&fit=crop",
  steak:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop",
  chicken:
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop",
  beef: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=1000&auto=format&fit=crop",
  pork: "https://images.unsplash.com/photo-1560781290-7dc94c0f8f4f?q=80&w=1000&auto=format&fit=crop",
  dessert:
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1000&auto=format&fit=crop",
  cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop",
  cookie:
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1000&auto=format&fit=crop",
  cookies:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1000&auto=format&fit=crop",
  gingerbread:
    "https://images.unsplash.com/photo-1607331364204-fc8bd57f9abe?q=80&w=1000&auto=format&fit=crop",
  gingerbread_cookies:
    "https://images.unsplash.com/photo-1607331364204-fc8bd57f9abe?q=80&w=1000&auto=format&fit=crop",
  squash:
    "https://images.unsplash.com/photo-1570586437263-ab629fccc818?q=80&w=1000&auto=format&fit=crop",
  butternut_squash:
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop",
  butternut_squash_soup:
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop",
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1000&auto=format&fit=crop",
  smoothie:
    "https://images.unsplash.com/photo-1553530666-ba11a90bb0ae?q=80&w=1000&auto=format&fit=crop",
  grill:
    "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=1000&auto=format&fit=crop",
  roast:
    "https://images.unsplash.com/photo-1608835291093-394b3ce426d7?q=80&w=1000&auto=format&fit=crop",
  bake: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?q=80&w=1000&auto=format&fit=crop",
  barbecue:
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=1000&auto=format&fit=crop",
  bbq: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=1000&auto=format&fit=crop",
  fried:
    "https://images.unsplash.com/photo-1518492104633-130d0cc84637?q=80&w=1000&auto=format&fit=crop",
  casserole:
    "https://images.unsplash.com/photo-1612462766564-11fc55d36ee9?q=80&w=1000&auto=format&fit=crop",
  pie: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1000&auto=format&fit=crop",
  bowl: "https://images.unsplash.com/photo-1540914124281-342587941389?q=80&w=1000&auto=format&fit=crop",
  toast:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=1000&auto=format&fit=crop",
  wrap: "https://images.unsplash.com/photo-1580013759032-c96505e24c1f?q=80&w=1000&auto=format&fit=crop",
  pancake:
    "https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?q=80&w=1000&auto=format&fit=crop",
  bread:
    "https://images.unsplash.com/photo-1556471013-0001958d2f12?q=80&w=1000&auto=format&fit=crop",
  chocolate:
    "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=1000&auto=format&fit=crop",
  cocktail:
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop",
  drink:
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop",
};

// Season-specific image collections
const seasonalImages: Record<string, string[]> = {
  spring: [
    "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?q=80&w=1000&auto=format&fit=crop", // Strawberry
    "https://images.unsplash.com/photo-1595908129746-57ca1a63dd4d?q=80&w=1000&auto=format&fit=crop", // Asparagus
    "https://images.unsplash.com/photo-1616501268214-e987151bdaa5?q=80&w=1000&auto=format&fit=crop", // Pea Soup
    "https://images.unsplash.com/photo-1556471013-0001958d2f12?q=80&w=1000&auto=format&fit=crop", // Bread
  ],
  summer: [
    "https://images.unsplash.com/photo-1605291545695-55e1f52403c5?q=80&w=1000&auto=format&fit=crop", // Peach
    "https://images.unsplash.com/photo-1563071957-bbc8bd8d3ad9?q=80&w=1000&auto=format&fit=crop", // Gazpacho
    "https://images.unsplash.com/photo-1470119693884-47d3a1d1f180?q=80&w=1000&auto=format&fit=crop", // Corn
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=1000&auto=format&fit=crop", // BBQ
  ],
  autumn: [
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1000&auto=format&fit=crop", // Pumpkin
    "https://images.unsplash.com/photo-1574767412232-a28dc2062263?q=80&w=1000&auto=format&fit=crop", // Apple
    "https://images.unsplash.com/photo-1476124369491-e7addf5db371?q=80&w=1000&auto=format&fit=crop", // Mushroom
    "https://images.unsplash.com/photo-1608835291093-394b3ce426d7?q=80&w=1000&auto=format&fit=crop", // Roast
  ],
  winter: [
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1000&auto=format&fit=crop", // Beef Stew
    "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1000&auto=format&fit=crop", // Squash
    "https://images.unsplash.com/photo-1607331364204-fc8bd57f9abe?q=80&w=1000&auto=format&fit=crop", // Cookies
    "https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?q=80&w=1000&auto=format&fit=crop", // Hot Drink
  ],
};

// Default image fallback
const defaultFoodImage =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";

// Array of backup images to use if no specific match is found
const backupFoodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515942459400-253945db440e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1000&auto=format&fit=crop",
];

/**
 * Gets an appropriate food image URL based on dish name and cuisine
 * @param dishName Name of the dish
 * @param cuisine Cuisine type
 * @param season Optional season parameter for seasonal dishes
 * @returns URL of an appropriate image
 */
export const getFoodImageUrl = (dishName = "", cuisine = "", season?: string) => {
  try {
    // For the specific beef stew recipe
    if (
      dishName.toLowerCase().includes("beef stew") ||
      dishName.toLowerCase() === "hearty beef stew"
    ) {
      return "https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1000&auto=format&fit=crop";
    }

    // Normalize inputs for matching
    const normalizedDishName = dishName.toLowerCase();
    const normalizedCuisine = cuisine.toLowerCase().replace(/\s+/g, "_");

    // 1. Check if we have a direct match for the cuisine
    if (normalizedCuisine in cuisineImages) {
      return cuisineImages[normalizedCuisine];
    }

    // 2. Try to match the dish type by looking for keywords in the dish name
    for (const [keyword, imageUrl] of Object.entries(dishTypeImages)) {
      if (normalizedDishName.includes(keyword.replace("_", " "))) {
        return imageUrl;
      }
    }

    // 3. If a season is provided, use a seasonal image
    if (season && season in seasonalImages) {
      const seasonalImagePool = seasonalImages[season as keyof typeof seasonalImages];
      if (seasonalImagePool && seasonalImagePool.length > 0) {
        // Get a consistent but pseudo-random image based on the dish name
        const index =
          Math.abs(
            normalizedDishName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
          ) % seasonalImagePool.length;
        return seasonalImagePool[index];
      }
    }

    // 4. Use a backup image based on the hash of the dish name
    const nameHash = normalizedDishName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return backupFoodImages[nameHash % backupFoodImages.length];
  } catch (error) {
    console.error("Error getting food image:", error);
    return defaultFoodImage;
  }
};
