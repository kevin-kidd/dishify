import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";

export const recipeRouter = router({
  generate,
  autocomplete,
});
