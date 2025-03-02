import type { DrizzleD1Database } from "drizzle-orm/d1";
import { createDb } from "./db/client";
import { auth } from "./auth";
import type { User } from "better-auth/types";
import type { dbSchema } from "./db/client";
import type { Bindings } from "./types";
import type { CfProperties } from "@cloudflare/workers-types";
import { EnvSchema, type RecipeQueueMessage, type ValidatedEnv } from "./types";
import { createGroq, type GroqProvider } from "@ai-sdk/groq";
import { tryCatch } from "@dishify/app/utils/helpers";

interface ApiContextProps {
  user: User | null;
  db: DrizzleD1Database<typeof dbSchema>;
  groq: GroqProvider;
  recipeState: KVNamespace;
  recipeQueue: Queue<RecipeQueueMessage>;
  env: ValidatedEnv;
  ai: Ai;
  cf?: CfProperties<unknown>;
}

export const createContext = async (
  env: Bindings,
  headers: Headers,
  cf?: CfProperties<unknown>,
): Promise<ApiContextProps> => {
  // Validate only the string-based environment variables
  const validatedEnv = EnvSchema.parse(env);

  const db = createDb(env.DB);
  const betterAuth = auth(env.DB, env);

  const { data: session, error: sessionError } = await tryCatch(
    betterAuth.api.getSession({
      headers: headers,
    }),
  );

  if (sessionError) {
    console.error("Session retrieval error:", sessionError);
  }

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
    ai: env.AI,
    cf,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
