import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { type InferSelectModel, and, eq, sql } from "drizzle-orm";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import type { DB } from "~/server/db";
import {
  expenses,
  groups,
  usersToGroups,
  type ExpenseShare,
} from "~/server/db/schema";
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

//* dont need to fetch and check the users, because in order for the sql operation to work 1. it has to be a valid user id, 2. Their balance needs to be associated with the correct group, 3. they need to be active in said group
const updateBalancesFromExpense = (
  trx: DB,
  {
    amount,
    groupId,
    creatorId,
    // users,
    shares,
  }: {
    amount: number;
    creatorId: string;
    groupId: string;
    // users: InferSelectModel<typeof usersToGroups>[];
    shares: ExpenseShare[];
  },
) => {
  const balanceUpdates = [];

  for (const share of shares) {
    // add amount - share to balance
    if (share.userId === creatorId) {
      balanceUpdates.push(
        trx
          .update(usersToGroups)
          .set({
            balance: sql`${usersToGroups.balance} + ${amount - share.amount}`,
          })
          .where(
            and(
              eq(usersToGroups.userId, creatorId),
              eq(usersToGroups.groupId, groupId),
              eq(usersToGroups.active, true),
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
          balance: sql`${usersToGroups.balance} - ${share.amount}`,
        })
        .where(
          and(
            eq(usersToGroups.userId, share.userId),
            eq(usersToGroups.groupId, groupId),
            eq(usersToGroups.active, true),
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
          with: {
            users: {
              where: eq(usersToGroups.active, true),
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
