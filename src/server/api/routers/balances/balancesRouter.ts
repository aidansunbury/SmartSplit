import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createTRPCRouter, groupProcedure } from "~/server/api/trpc";
import { usersToGroups } from "~/server/db/schema";

export const balancesRouter = createTRPCRouter({
  // Get latest balances for a group
  get: groupProcedure.query(async ({ ctx, input }) => {
    const balances = await ctx.db
      .select()
      .from(usersToGroups)
      .where(eq(usersToGroups.groupId, input.groupId));
    if (!balances) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Group not found",
      });
    }
    return balances;
  }),
});
