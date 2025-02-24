import { eq } from "drizzle-orm";
import { UserTable } from "../db/schema/user";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { tryCatch } from "@dishify/app/utils/helpers";

export const userRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const { data: userRow, error } = await tryCatch(
      db.select().from(UserTable).where(eq(UserTable.id, user.id)).get(),
    );

    if (error) {
      console.error("Failed to fetch user data:", {
        error: error.message,
        userId: user.id,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user data",
      });
    }

    if (!userRow) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found in database",
      });
    }

    return userRow;
  }),
});
