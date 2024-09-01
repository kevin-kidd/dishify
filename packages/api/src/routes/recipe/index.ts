import { router } from "../../trpc";
import { generate } from "./generate";

export const recipeRouter = router({
  generate,
});
