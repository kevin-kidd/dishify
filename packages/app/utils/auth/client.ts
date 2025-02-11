"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    enabled: true,
    autoSignInAfterVerification: true,
  },
  changeEmail: {
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
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});
