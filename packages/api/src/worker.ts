import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@dishify/api/src/context";
import { appRouter } from "@dishify/api/src/router";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb } from "./db/client";
import { generateRecipe } from "./queues/generate";
import { auth } from "./auth";
import type { Bindings, RecipeQueueMessage } from "./types";
import { tryCatch } from "@dishify/app/utils/helpers";
import { generateFeaturedRecipe } from "./queues/featured";
import { updateRecipe } from "./queues/update";
import { refreshTrendingRecipes } from "./queues/trending";

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());

// Setup CORS for the frontend
app.use("*", async (c, next) => {
  if (c.env.APP_URL === undefined) {
    console.log(
      "APP_URL is not set. CORS errors may occur. Make sure the environment variables are properly configured",
    );
  }

  return await cors({
    origin: [c.env.APP_URL],
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours
  })(c, next);
});

// Setup TRPC server with context
app.use("/trpc/*", async (c, next) => {
  return await trpcServer({
    router: appRouter,
    createContext: async (): Promise<Record<string, unknown>> => {
      const context = await createContext(c.env, c.req.raw.headers, c.req.raw.cf);
      return { ...context };
    },
  })(c, next);
});

// For auth
app.on(["POST", "GET"], "/api/auth/**", (c) => auth(c.env.DB, c.env).handler(c.req.raw));

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<RecipeQueueMessage>, env: Bindings): Promise<void> {
    const db = createDb(env.DB);
    for (const message of batch.messages) {
      // Check the type of queue message
      if (message.body.type === "update") {
        // Recipe update queue
        const { error } = await tryCatch(updateRecipe(message.body, db, env));
        if (error) {
          console.error("Failed to process recipe update queue message:", {
            error: error.message,
            recipeId: message.body.recipeId,
          });
        }
      } else if (message.body.type === "featured") {
        // Featured recipe generation
        const { error } = await tryCatch(generateFeaturedRecipe(env, db));
        if (error) {
          console.error("Failed to process featured recipe queue message:", {
            error: error.message,
          });
        }
      } else if (message.body.type === "trending-refresh") {
        // Trending recipes refresh
        const { error } = await tryCatch(refreshTrendingRecipes(message.body, db, env));
        if (error) {
          console.error("Failed to process trending refresh queue message:", {
            error: error.message,
            timestamp: message.body.timestamp,
          });
        }
      } else {
        // Regular recipe generation
        const { error } = await tryCatch(generateRecipe(message.body, db, env));
        if (error) {
          console.error("Failed to process recipe queue message:", {
            error: error.message,
            recipeId: message.body.recipeId,
            dishName: message.body.dishName,
          });
        }
      }
    }
  },
};
