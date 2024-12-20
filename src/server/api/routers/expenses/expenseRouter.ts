import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { type InferSelectModel, and, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import type { DB } from "~/server/db";
import { expenses, groups, usersToGroups } from "~/server/db/schema";
import {
  createExpenseValidator,
  editExpenseValidator,
} from "./expenseValidators";

const expenseOwnerProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const [expense] = await ctx.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, input.id),
          eq(expenses.userId, ctx.session.user.id),
        ),
      );
    if (!expense) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Expense does not exist or user is not the owner",
      });
    }
    return next({
      ctx: {
        ...ctx,
        expense,
      },
    });
  });

// When an expense is created, the balance of the user who created the expense is increased. If an expense is deleted or revised downwards, it is as if a "negative" expense was created from the perspective of updating balances.
//* This should be relatively trivial to modify later for splitting with subsets of the group, as we will just filter the groupUsers before passing them to this function
const updateBalancesFromExpense = (
  trx: DB,
  {
    amount,
    groupId,
    creatorId,
    users,
  }: {
    amount: number;
    creatorId: string;
    groupId: string;
    users: InferSelectModel<typeof usersToGroups>[];
  },
) => {
  // //! This math may make things off by a couple of cents. Cry about it.
  const baseShare = Math.floor(amount / users.length);

  // If a user spends $30 in a group of three, they are owed $20, not $30
  const owed = baseShare * (users.length - 1);

  // Subtract a base share from all users in the group who did not create the expense
  const balanceUpdates = [];
  for (const user of users) {
    if (user.userId === creatorId) {
      // Add the owed to the user who created the expense
      balanceUpdates.push(
        trx
          .update(usersToGroups)
          .set({
            // @ts-ignore: Owed is an integer
            balance: user.balance + owed,
          })
          .where(
            and(
              eq(usersToGroups.userId, creatorId),
              eq(usersToGroups.groupId, groupId),
            ),
          )
          .returning(),
      );
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
            eq(usersToGroups.groupId, groupId),
          ),
        )
        .returning(),
    );
  }
  return balanceUpdates;
};

export const expenseRouter = createTRPCRouter({
  create: groupProcedure
    .input(createExpenseValidator)
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
            users: {
              orderBy: (usersToGroups, { asc }) => [asc(usersToGroups.userId)],
            },
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

        const balanceUpdates = updateBalancesFromExpense(trx, {
          amount: input.amount,
          creatorId: ctx.session.user.id,
          groupId: input.groupId,
          users: groupUsers.users,
        });

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
  edit: expenseOwnerProcedure
    .input(editExpenseValidator)
    .mutation(async ({ input, ctx }) => {
      const expense = await ctx.db.transaction(async (trx) => {
        const updatedExpensePromise = trx
          .update(expenses)
          .set(input)
          .where(
            and(
              eq(expenses.id, ctx.expense.id),
              eq(expenses.userId, ctx.session.user.id),
            ),
          )
          .returning();
        if (input.amount !== undefined && input.amount !== ctx.expense.amount) {
          const difference = input.amount - ctx.expense.amount;

          const groupUsers = await trx.query.groups.findFirst({
            where: eq(groups.id, ctx.expense.groupId),
            with: {
              users: {
                orderBy: (usersToGroups, { asc }) => [
                  asc(usersToGroups.userId),
                ],
              },
            },
          });

          if (!groupUsers) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Group not found",
            });
          }

          const balanceUpdates = updateBalancesFromExpense(trx, {
            amount: difference,
            creatorId: ctx.session.user.id,
            groupId: ctx.expense.groupId,
            users: groupUsers.users,
          });

          await Promise.all(balanceUpdates);
        }
        const [updatedExpense] = await updatedExpensePromise;
        if (!updatedExpense) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update expense",
          });
        }
        return updatedExpense;
      });
      return expense;
    }),
  delete: expenseOwnerProcedure.mutation(async ({ ctx }) => {
    const expense = await ctx.db.transaction(async (trx) => {
      const groupUsers = await trx.query.groups.findFirst({
        where: eq(groups.id, ctx.expense.groupId),
        with: {
          users: {
            orderBy: (usersToGroups, { asc }) => [asc(usersToGroups.userId)],
          },
        },
      });

      if (!groupUsers) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      const balanceUpdates = updateBalancesFromExpense(trx, {
        amount: -ctx.expense.amount,
        creatorId: ctx.session.user.id,
        groupId: ctx.expense.groupId,
        users: groupUsers.users,
      });

      const [deletedExpense] = await trx
        .delete(expenses)
        .where(
          and(
            eq(expenses.id, ctx.expense.id),
            eq(expenses.userId, ctx.session.user.id),
          ),
        )
        .returning();
      await Promise.all(balanceUpdates);

      if (!deletedExpense) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete expense",
        });
      }
      return deletedExpense;
    });
    return expense;
  }),
});
