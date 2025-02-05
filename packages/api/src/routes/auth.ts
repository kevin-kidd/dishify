import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  secretMessage: protectedProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return "You are authenticated via Better Auth!";
  }),
});
