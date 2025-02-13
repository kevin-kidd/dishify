import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createDb } from "./db/client";
import { auth } from "./auth";
import type { User } from "better-auth/types";
import type { dbSchema } from "./db/client";
import type { Bindings } from "./worker";
import type { CfProperties } from "@cloudflare/workers-types";
import { EnvSchema, type Env } from "./types";
import { createGroq, type GroqProvider } from "@ai-sdk/groq";

interface ApiContextProps {
  user: User | null;
  db: DrizzleD1Database<typeof dbSchema>;
  groq: GroqProvider;
  recipeState: KVNamespace;
  recipeQueue: Queue<{ recipeId: string; dishName?: string; image?: number[] }>;
  env: Env;
  cf?: CfProperties<unknown>;
}

export const createContext = async (
  env: Bindings & Env,
  headers: Headers,
  cf?: CfProperties<unknown>,
): Promise<ApiContextProps> => {
  // Validate environment variables
  // This will only validate the Env part of the object, ignoring additional Bindings properties
  const validatedEnv = EnvSchema.parse(env);

  const db = createDb(env.DB);
  const betterAuth = auth(env.DB, validatedEnv);

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

  const groq = createGroq({
    apiKey: env.GROQ_API_KEY,
  });

  return {
    user,
    db,
    groq,
    recipeState: env.RECIPE_STATE,
    recipeQueue: env.RECIPE_QUEUE,
    env: validatedEnv,
    cf,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
