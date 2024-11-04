import { z } from "zod";

import { createTRPCRouter, groupProcedure } from "~/server/api/trpc";
import { groups, expenses, usersToGroups } from "~/server/db/schema";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";

export const expenseRouter = createTRPCRouter({
  create: groupProcedure
    .input(safeInsertSchema(expenses))
    .mutation(async ({ input, ctx }) => {
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
          const [awaitedExpense] = await newExpense;
          if (!awaitedExpense) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create expense",
            });
          }
          return awaitedExpense;
        }

        //! This math may make things off by a couple of cents. Cry about it.
        const baseShare = Math.floor(input.amount / groupUsers.users.length);

        // If a user spends $30 in a group of three, they are owed $20, not $30
        const owed = baseShare * (groupUsers.users.length - 1);

        // Subtract a base share from all users in the group who did not create the expense
        const balanceUpdates = [];
        for (const user of groupUsers.users) {
          if (user.userId === ctx.session.user.id) {
            continue;
          }
          balanceUpdates.push(
            trx
              .update(usersToGroups)
              .set({
                balance: user.balance - baseShare,
              })
              .where(
                and(
                  eq(usersToGroups.userId, user.userId),
                  eq(usersToGroups.groupId, input.groupId),
                ),
              )
              .returning(),
          );
        }

        // Add the owed to the user who created the expense
        balanceUpdates.push(
          trx
            .update(usersToGroups)
            .set({
              // @ts-ignore: Owed is an integer
              balance: usersToGroups.balance + owed,
            })
            .where(
              and(
                eq(usersToGroups.userId, ctx.session.user.id),
                eq(usersToGroups.groupId, input.groupId),
              ),
            )
            .returning(),
        );

        const updatedBalances = await Promise.all(balanceUpdates);
        const [updatedExpense] = await newExpense;

        if (!updatedExpense) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create expense",
          });
        }
        return updatedExpense;
      });
      return newExpense;
    }),

  // get an individual expense and comments
  getExpenseWithComments: groupProcedure
    .input(
      z.object({
        expenseId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const expenseWithComments = await ctx.db.query.expenses.findFirst({
        where: eq(expenses.id, input.expenseId),
        with: {
          comments: {
            orderBy: (comments, { asc }) => [asc(comments.createdAt)],
          },
        },
      });
      return expenseWithComments;
    }),
});
