export interface Env {
  // Auth-related environment variables
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Social provider credentials
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;

  RESEND_API_KEY: string;
  APP_URL: string;
}
