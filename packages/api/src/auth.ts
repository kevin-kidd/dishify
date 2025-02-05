import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "./db/client";
import { expo } from "@better-auth/expo";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email";
import { jwt } from "better-auth/plugins";
import type { Env } from "./types";

export const auth = (d1: D1Database, env: Env) => {
  if (
    !env.FACEBOOK_CLIENT_ID ||
    !env.FACEBOOK_CLIENT_SECRET ||
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.MICROSOFT_CLIENT_ID ||
    !env.MICROSOFT_CLIENT_SECRET ||
    !env.BETTER_AUTH_SECRET ||
    !env.BETTER_AUTH_URL ||
    !env.RESEND_API_KEY
  ) {
    throw new Error("Missing required environment variables for authentication");
  }

  const db = createDb(d1);

  return betterAuth({
    appName: "Dishify",
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      sendResetPassword: ({ url, user }) => sendResetPasswordEmail({ url, user }, env),
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ url, user }) => sendVerificationEmail({ url, user }, env),
      sendOnSignUp: true,
    },
    plugins: [expo(), jwt()],
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    socialProviders: {
      apple: {
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      facebook: {
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
      },
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
      },
    },
  });
};
