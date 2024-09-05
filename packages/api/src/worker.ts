import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@dishify/api/src/context";
import { appRouter } from "@dishify/api/src/router";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

type Bindings = {
  DB: D1Database;
  JWT_VERIFICATION_KEY: string;
  GROQ_API_KEY: string;
  ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  APP_URL: string;
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());

// Setup CORS for the frontend
app.use("/trpc/*", async (c, next) => {
  if (c.env.APP_URL === undefined) {
    console.log(
      "APP_URL is not set. CORS errors may occur. Make sure the .dev.vars file is present at /packages/api/.dev.vars"
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
    createContext: async (opts): Promise<Record<string, unknown>> => {
      const context = await createContext(
        c.env.DB,
        c.env.JWT_VERIFICATION_KEY,
        c.env.GROQ_API_KEY,
        GROQ_BASE_URL,
        {
          client: c.env.AI,
          gatewayId: c.env.AI_GATEWAY_ID,
        },
        opts
      );
      return { ...context };
    },
  })(c, next);
});

export default app;
