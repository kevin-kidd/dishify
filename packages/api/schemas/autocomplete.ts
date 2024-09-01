import { z } from "zod";

export const AutoCompleteRequestSchema = z.object({
  query: z
    .string()
    .max(50, "Query must be less than 50 characters") // D1 limits LIKE queries to 50 bytes
    .min(2, "Query must be at least 2 characters"),
  language: z.enum(["en", "es", "de", "fr", "it"]),
});

export type AutoCompleteRequest = z.infer<typeof AutoCompleteRequestSchema>;
