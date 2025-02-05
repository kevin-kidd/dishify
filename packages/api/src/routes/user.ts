import { eq } from "drizzle-orm";
import { UserTable } from "../db/schema/user";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const userRow = await db.select().from(UserTable).where(eq(UserTable.id, user.id)).get();
    return userRow;
  }),
});
