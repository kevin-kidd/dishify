import type { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  APP_URL: string;

  // Auth-related environment variables
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Social provider credentials
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;

  RESEND_API_KEY: string;
}
