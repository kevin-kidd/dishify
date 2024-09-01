import { generate } from "./recipe/generate";
import { autocomplete } from "./recipe/autocomplete";
import { router } from "../trpc";
export const recipeRouter = router({
  generate: generate,
  autcomplete: autocomplete,
});
