import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  groupProcedure,
} from "~/server/api/trpc";
import { groups, expenses } from "~/server/db/schema";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const expenseRouter = createTRPCRouter({
  create: groupProcedure
    .input(safeInsertSchema(expenses))
    .query(async ({ input, ctx }) => {
      const newExpense = await ctx.db.transaction(async (trx) => {
        const newExpense = trx
          .insert(expenses)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();
        const groupUsers = await trx.query.groups.findFirst({
          where: eq(groups.id, input.groupId),
          with: {
            users: true,
          },
        });
        if (!groupUsers) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        // If there is only one user in the group, don't modify the balances as there is no one to share the expense with
        if (groupUsers.users.length < 2) {
          return await newExpense;
        }

        //! This math may make things off by a couple of cents
        const baseShare = Math.floor(input.amount / groupUsers.users.length);
        const owed = baseShare * (groupUsers.users.length - 1);

        // Subtract a base share from all users in the group who did not create the expense

        // Add the owed to the user who created the expense

        if (!newExpense) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create expense",
          });
        }
        return newExpense;
      });
      return newExpense;
    }),
});
