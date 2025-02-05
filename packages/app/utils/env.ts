/**
 * Environment variable configuration for shared app package.
 * Handles both client and server environments with proper type safety.
 */

import { object, parse, string } from "valibot";

// Public environment schema (available in both client & server)
const envSchema = object({
  // Routing
  NEXT_PUBLIC_API_URL: string(),
  NEXT_PUBLIC_APP_URL: string(),
  // Authentication
  NEXT_PUBLIC_AUTH_BASE_URL: string(),
  // Customer Support
  NEXT_PUBLIC_SUPPORT_EMAIL: string(),
  // Web Metadata
  NEXT_PUBLIC_METADATA_NAME: string(),
});

export const env = parse(envSchema, process.env);
