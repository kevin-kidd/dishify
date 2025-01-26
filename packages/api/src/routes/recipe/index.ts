import { router } from "../../trpc";
import { autocomplete } from "./autocomplete";
import { generate } from "./generate";

export const recipeRouter = router({
  generate,
  autocomplete,
});
const test = "";
console.log(test);
console.log("test: ", test);
