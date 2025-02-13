import { defineConfig } from "drizzle-kit";

/*
 * NOTE: Workaround to make drizzle studio work with D1.
 * https://kevinkipp.com/blog/going-full-stack-on-astro-with-cloudflare-d1-and-drizzle/
 * Github discussion: https://github.com/drizzle-team/drizzle-orm/discussions/1545#discussioncomment-8115423
 */

console.log("test", process.env);
export default process.env.DB_LOCAL_PATH
  ? defineConfig({
      schema: [
        "./src/db/schema/user.ts",
        "./src/db/schema/recipes.ts",
        "./src/db/schema/marketplace.ts",
      ],
      out: "./migrations",
      dialect: "sqlite",
      dbCredentials: {
        url: process.env.DB_LOCAL_PATH,
      },
    })
  : defineConfig({
      schema: [
        "./src/db/schema/user.ts",
        "./src/db/schema/recipes.ts",
        "./src/db/schema/marketplace.ts",
      ],
      out: "./migrations",
      driver: "d1-http",
      dialect: "sqlite",
      dbCredentials: {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        accountId: process.env.ACCOUNT_ID!,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        token: process.env.CF_API_TOKEN!,
        databaseId:
          process.env.NODE_ENV === "preview"
            ? // biome-ignore lint/style/noNonNullAssertion: <explanation>
              process.env.PREVIEW_DATABASE_ID!
            : // biome-ignore lint/style/noNonNullAssertion: <explanation>
              process.env.PROD_DATABASE_ID!,
      },
    });
