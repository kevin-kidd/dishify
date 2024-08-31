import {
  EnglishRecipeNameTable,
  FrenchRecipeNameTable,
  GermanRecipeNameTable,
  ItalianRecipeNameTable,
  SpanishRecipeNameTable,
} from "../../db/schema";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { like } from "drizzle-orm";

export const autocomplete = publicProcedure
  .input(
    z.object({
      query: z.string(),
      language: z.enum(["en", "es", "de", "fr", "it"]),
    })
  )
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
      .select()
      .from(table)
      .where(like(table.name, `${query}%`))
      .limit(10);
    return results;
  });

type RecipeNameTable =
  | typeof EnglishRecipeNameTable
  | typeof SpanishRecipeNameTable
  | typeof GermanRecipeNameTable
  | typeof FrenchRecipeNameTable
  | typeof ItalianRecipeNameTable
  | null;
