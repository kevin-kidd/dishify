import { z } from "zod";

export const EnvSchema = z
  .object({
    // Auth-related environment variables
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),

    // Social provider credentials
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    MICROSOFT_CLIENT_ID: z.string(),
    MICROSOFT_CLIENT_SECRET: z.string(),

    RESEND_API_KEY: z.string(),
    APP_URL: z.string().url(),

    // Marketplace credentials
    WALMART_CONSUMER_ID: z.string(),
    WALMART_PRIVATE_KEY: z.string(),
    RAPID_API_KEY: z.string(),
  })
  .passthrough();

export type Env = z.infer<typeof EnvSchema>;
