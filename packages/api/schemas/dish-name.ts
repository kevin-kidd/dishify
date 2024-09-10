import { z } from "zod";
import { Filter } from "glin-profanity";

const profanityFilter = new Filter({
  allLanguages: true,
  wordBoundaries: true,
  ignoreWords: ["ass"],
});

export const DishNameSchema = z
  .object({
    dishName: z
      .string()
      .min(3, "Must be at least 3 characters")
      .max(80, "Must be less than 80 characters"),
  })
  .superRefine(({ dishName }, ctx) => {
    const profanity = profanityFilter.checkProfanity(dishName);
    if (profanity.containsProfanity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must not contain profanity (${profanity.profaneWords.join(", ")})`,
        path: ["dishName"],
      });
    }
  });

export type DishName = z.infer<typeof DishNameSchema>;
