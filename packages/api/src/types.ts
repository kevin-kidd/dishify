import { z } from "zod";

// Schema for validating string-based environment variables
export const EnvSchema = z
  .object({
    // Auth-related environment variables
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    GROQ_API_KEY: z.string(),
    SERPER_API_KEY: z.string(),
    ACCOUNT_ID: z.string(),
    AI_GATEWAY_ID: z.string(),
    APP_URL: z.string().url(),
    // Social provider credentials
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),
    // Cloudflare Images
    CF_IMAGES_API_TOKEN: z.string(),
    CF_IMAGES_ACCOUNT_HASH: z.string(),

    RESEND_API_KEY: z.string(),
  })
  .passthrough();

// Type for validated environment variables
export type ValidatedEnv = z.infer<typeof EnvSchema>;

// Full environment type including bindings
export interface Env extends ValidatedEnv {
  RECIPE_STATE: KVNamespace;
  RECIPE_QUEUE: Queue<RecipeQueueMessage>;
}

// Bindings type for Cloudflare Workers
export type Bindings = Env & {
  DB: D1Database;
  AI: Ai;
  RECIPE_STATE: KVNamespace;
  AuthKV: KVNamespace;
};

export interface RecipeQueueMessage {
  recipeId: string;
  dishName?: string;
  hasImage?: boolean;
  updateImage?: boolean;
  updateDescription?: boolean;
  type?: "recipe" | "featured" | "update"; // Type of operation
}
