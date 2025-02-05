import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createDb } from "./db/client";
import Groq from "groq-sdk";
import { auth } from "./auth";
import type { User } from "better-auth/types";
import type { dbSchema } from "./db/client";
import type { Bindings } from "./worker";

interface ApiContextProps {
  user: User | null;
  db: DrizzleD1Database<typeof dbSchema>;
  ai: {
    client: Ai;
    gatewayId: string;
  };
  groq: Groq;
  recipeState: KVNamespace;
  env: {
    RECIPE_QUEUE: Queue<{ recipeId: string; dishName?: string; image?: number[] }>;
  };
}

export const createContext = async (
  d1: D1Database,
  GROQ_API_KEY: string,
  GROQ_BASE_URL: string,
  ai: {
    client: Ai;
    gatewayId: string;
  },
  recipeState: KVNamespace,
  recipeQueue: Queue,
  env: Bindings,
  headers: Headers,
): Promise<ApiContextProps> => {
  const db = createDb(d1);
  const betterAuth = auth(d1, env);

  const session = await betterAuth.api
    .getSession({
      headers: headers,
    })
    .catch((error) => {
      console.error("Session retrieval error:", error);
      return null;
    });

  let user = null;
  if (session?.user) {
    user = session.user;
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY, baseURL: GROQ_BASE_URL });

  return {
    user,
    db,
    ai,
    groq,
    recipeState,
    env: {
      RECIPE_QUEUE: recipeQueue as Queue<{ recipeId: string; dishName?: string; image?: number[] }>,
    },
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
