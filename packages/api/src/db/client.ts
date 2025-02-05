import { drizzle } from "drizzle-orm/d1";
import * as userSchema from "./schema/user";
import * as recipeSchema from "./schema/recipes";

export const dbSchema = { ...userSchema, ...recipeSchema };

export const createDb = (d1: D1Database) => {
  return drizzle(d1, { schema: dbSchema });
};
