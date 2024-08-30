import { authRouter } from "./routes/auth"
import { userRouter } from "./routes/user"
import { router } from "./trpc"

export const appRouter = router({
  user: userRouter,
  auth: authRouter,
})

export type AppRouter = typeof appRouter
