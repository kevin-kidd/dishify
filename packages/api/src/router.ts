import { authRouter } from "./routes/auth";
import { recipeRouter } from "./routes/recipe";
import { userRouter } from "./routes/user";
import { marketplaceRouter } from "./routes/marketplace";
import { router } from "./trpc";

export const appRouter = router({
  user: userRouter,
  auth: authRouter,
  recipe: recipeRouter,
  marketplace: marketplaceRouter,
});

export type AppRouter = typeof appRouter;
