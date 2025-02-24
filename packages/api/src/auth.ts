import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "./db/client";
import { expo } from "@better-auth/expo";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendChangeEmailVerification,
} from "./email";
import { jwt } from "better-auth/plugins";
import type { Env } from "./types";
import { tryCatch } from "@dishify/app/utils/helpers";

export const auth = (d1: D1Database, env: Env) => {
  // Validate required environment variables
  const requiredEnvVars = [
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MICROSOFT_CLIENT_ID",
    "MICROSOFT_CLIENT_SECRET",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "RESEND_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !env[varName as keyof Env]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for authentication: ${missingVars.join(", ")}`,
    );
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
      sendResetPassword: async ({ url, user }) => {
        const { error } = await tryCatch(sendResetPasswordEmail({ url, user }, env));
        if (error) {
          console.error("Failed to send reset password email:", error);
        }
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ url, user }) => {
        const { error } = await tryCatch(sendVerificationEmail({ url, user }, env));
        if (error) {
          console.error("Failed to send verification email:", error);
        }
      },
      sendOnSignUp: true,
    },
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, newEmail, url }, request) => {
          const { error } = await tryCatch(
            sendChangeEmailVerification({ url, user, newEmail }, env),
          );
          if (error) {
            console.error("Failed to send change email verification:", error);
          }
        },
      },
    },
    plugins: [expo(), jwt()],
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    socialProviders: {
      microsoft: {
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      },
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
      },
    },
  });
};
