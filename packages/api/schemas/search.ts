import { z } from "zod";
import { Filter } from "glin-profanity";

const profanityFilter = new Filter({
  languages: ["english"],
  wordBoundaries: true,
  ignoreWords: ["ass"],
});

export const SearchSchema = z
  .object({
    dishName: z
      .string()
      .min(3, "Must be at least 3 characters")
      .max(80, "Must be less than 80 characters")
      .optional()
      .or(z.literal("")),
    image: z.number().array().optional(),
  })
  .superRefine(({ dishName, image }, ctx) => {
    if (!image && !dishName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must provide a dish name or an image.",
        path: ["dishName"],
      });
    }
    if (dishName && !image) {
      const profanity = profanityFilter.checkProfanity(dishName);
      if (profanity.containsProfanity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Must not contain profanity (${profanity.profaneWords.join(", ")})`,
          path: ["dishName"],
        });
      }
    }
  });

export type SearchValues = z.infer<typeof SearchSchema>;
