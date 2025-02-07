"use client";

import { createAuthClient } from "better-auth/react";
import { env } from "../env";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    enabled: true,
    autoSignInAfterVerification: true,
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
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});
