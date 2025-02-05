import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@dishify/api/src/context";
import { appRouter } from "@dishify/api/src/router";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb } from "./db/client";
import { generateRecipe } from "./queue";
import { auth } from "./auth";
import type { Env } from "./types";

export type Bindings = Env & {
  DB: D1Database;
  GROQ_API_KEY: string;
  ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  APP_URL: string;
  AI: Ai;
  RECIPE_STATE: KVNamespace;
  RECIPE_QUEUE: Queue;
  AuthKV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());

// Setup CORS for the frontend
app.use("/trpc/*", async (c, next) => {
  if (c.env.APP_URL === undefined) {
    console.log(
      "APP_URL is not set. CORS errors may occur. Make sure the .dev.vars file is present at /packages/api/.dev.vars",
    );
  }
  return await cors({
    origin: (origin) => (origin.endsWith(new URL(c.env.APP_URL).host) ? origin : c.env.APP_URL),
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    // https://hono.dev/middleware/builtin/cors#options
  })(c, next);
});

// Setup TRPC server with context
app.use("/trpc/*", async (c, next) => {
  const GROQ_BASE_URL = `https://gateway.ai.cloudflare.com/v1/${c.env.ACCOUNT_ID}/${c.env.AI_GATEWAY_ID}/groq`;
  return await trpcServer({
    router: appRouter,
    createContext: async (): Promise<Record<string, unknown>> => {
      const context = await createContext(
        c.env.DB,
        c.env.GROQ_API_KEY,
        GROQ_BASE_URL,
        {
          client: c.env.AI,
          gatewayId: c.env.AI_GATEWAY_ID,
        },
        c.env.RECIPE_STATE,
        c.env.RECIPE_QUEUE,
        c.env,
        c.req.raw.headers,
      );
      return { ...context };
    },
  })(c, next);
});

// For auth
app.on(["POST", "GET"], "/api/auth/**", (c) => auth(c.env.DB, c.env).handler(c.req.raw));

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<any>, env: Bindings): Promise<void> {
    const db = createDb(env.DB);
    for (const message of batch.messages) {
      const { recipeId, dishName, image } = message.body;
      await generateRecipe(recipeId, dishName, image, db, env);
    }
  },
};
