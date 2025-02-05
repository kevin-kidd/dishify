import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import type { BetterAuthClientPlugin } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    enabled: true,
  },
  socialProviders: {
    google: {
      enabled: true,
    },
    facebook: {
      enabled: true,
    },
    microsoft: {
      enabled: true,
    },
  },
  plugins: [
    expoClient({
      scheme: "dishify",
      storagePrefix: "dishify",
      storage: SecureStore,
    }) as BetterAuthClientPlugin,
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});
