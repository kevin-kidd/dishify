import {
  EnglishRecipeNameTable,
  FrenchRecipeNameTable,
  GermanRecipeNameTable,
  ItalianRecipeNameTable,
  SpanishRecipeNameTable,
} from "../../db/schema/recipes";
import { publicProcedure } from "../../trpc";
import { like } from "drizzle-orm";
import { AutoCompleteRequestSchema } from "../../../schemas/autocomplete";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "@dishify/app/utils/helpers";

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

    const { data: results, error } = await tryCatch(
      db
        .select({ name: table.name })
        .from(table)
        .where(like(table.name, `${query}%`))
        .limit(5),
    );

    if (error) {
      console.error("Failed to fetch autocomplete results:", {
        error: error.message,
        query,
        language,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch autocomplete suggestions",
      });
    }

    return (results || []).map((result) => result.name);
  });

type RecipeNameTable =
  | typeof EnglishRecipeNameTable
  | typeof SpanishRecipeNameTable
  | typeof GermanRecipeNameTable
  | typeof FrenchRecipeNameTable
  | typeof ItalianRecipeNameTable
  | null;
