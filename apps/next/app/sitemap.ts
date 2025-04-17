import type { MetadataRoute } from "next";
import { serverClient } from "utils/trpc";
import { categories } from "@dishify/api/schemas/category";

// SEO-friendly descriptions for static pages
const staticPageDescriptions = {
  signIn: "Sign in to your Dishify account to access personalized recipes, favorites, and more.",
  signUp:
    "Create a new Dishify account to unlock AI-powered recipe generation and smart shopping features.",
  forgotPassword: "Reset your Dishify account password quickly and securely.",
  updatePassword: "Update your Dishify account password to keep your account secure.",
  favorites: "View and manage your favorite recipes on Dishify for quick access anytime.",
};

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

  // Add all category pages
  for (const category of categories) {
    sitemapEntries.push({
      url: `https://dishify.app/category/${category.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return sitemapEntries;
}
