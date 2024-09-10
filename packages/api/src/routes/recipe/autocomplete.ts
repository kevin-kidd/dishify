import {
  EnglishRecipeNameTable,
  FrenchRecipeNameTable,
  GermanRecipeNameTable,
  ItalianRecipeNameTable,
  SpanishRecipeNameTable,
} from "../../db/schema";
import { publicProcedure } from "../../trpc";
import { and, like, sql } from "drizzle-orm";
import { AutoCompleteRequestSchema } from "../../../schemas/autocomplete";

export const autocomplete = publicProcedure
  .input(AutoCompleteRequestSchema)
  .query(async ({ ctx: { db }, input: { query, language } }) => {
    let table: RecipeNameTable;
    switch (language) {
      case "en":
        table = EnglishRecipeNameTable;
        break;
      case "es":
        table = SpanishRecipeNameTable;
        break;
      case "de":
        table = GermanRecipeNameTable;
        break;
      case "fr":
        table = FrenchRecipeNameTable;
        break;
      case "it":
        table = ItalianRecipeNameTable;
        break;
      default:
        table = EnglishRecipeNameTable;
    }
    if (!table) {
      throw new Error("Unsupported language");
    }
    const results = await db
      .select({ name: table.name })
      .from(table)
      .where(and(like(table.name, `${query}%`), sql`LOWER(${table.name}) != LOWER(${query})`))
      .limit(5);
    return results.map((result) => result.name);
  });

type RecipeNameTable =
  | typeof EnglishRecipeNameTable
  | typeof SpanishRecipeNameTable
  | typeof GermanRecipeNameTable
  | typeof FrenchRecipeNameTable
  | typeof ItalianRecipeNameTable
  | null;
