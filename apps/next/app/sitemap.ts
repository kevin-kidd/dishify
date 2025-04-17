import type { MetadataRoute } from "next";
import { serverClient } from "utils/trpc";
import { categories } from "@dishify/api/schemas/category";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all completed recipes with slug, updatedAt, and imageUrl
  const all = await serverClient.recipe.getAllRecipeSlugs.query();

  // Home page entry
  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: "https://dishify.app",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: "https://dishify.app/account/sign-in",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://dishify.app/account/sign-up",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://dishify.app/account/forgot-password",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://dishify.app/account/update-password",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: "https://dishify.app/favorites",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Add all category pages
  for (const category of categories) {
    sitemapEntries.push({
      url: `https://dishify.app/category/${category.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Add all dish pages
  for (const recipe of all) {
    // If imageUrl is available, include it in the images array
    const entry: MetadataRoute.Sitemap[number] = {
      url: `https://dishify.app/dish/${recipe.slug}`,
      lastModified: recipe.updatedAt ? new Date(recipe.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
    };
    sitemapEntries.push(entry);
  }

  return sitemapEntries;
}
