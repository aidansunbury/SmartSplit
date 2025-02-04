import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { expenses, groups, type ExpenseShare } from "~/server/db/schema";
import {
  createExpenseValidator,
  editExpenseValidator,
  withSharesValidation,
} from "./expenseValidators";
import {
  preprocessShares,
  calculateAdjustments,
  updateBalances,
} from "./expenseHelpers";

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

//! Ensuring the sums are equal will be handled by zod, but it's not working with trpc-ui yet
export const expenseRouter = createTRPCRouter({
  create: groupProcedure
    .input(
      createExpenseValidator.refine((data) => {
        const totalShares = data.shares.reduce(
          (acc, { amount }) => acc + amount,
          0,
        );
        return totalShares === data.amount;
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const newExpense = await ctx.db.transaction(async (trx) => {
        const newExpense = trx
          .insert(expenses)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();

        // The expense creator's balance update is total - share, while the other users' balances are just -share
        const adjustedShares = input.shares.map((share) => {
          if (share.userId === ctx.session.user.id) {
            return {
              ...share,
              amount: input.amount - share.amount,
            };
          }

          return {
            ...share,
            amount: -share.amount,
          };
        });
        // Ensure the creator's share is included in the balance updates
        if (
          !adjustedShares.some((share) => share.userId === ctx.session.user.id)
        ) {
          adjustedShares.push({
            userId: ctx.session.user.id,
            amount: 0,
          });
        }
        const balanceUpdates = updateBalances(trx as any, {
          groupId: input.groupId,
          shares: adjustedShares,
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
  //! Ensuring the sums are equal to the total will be handled by zod, but it's not working with trpc-ui yet
  edit: expenseOwnerProcedure
    .input(
      editExpenseValidator.refine((data) => {
        const totalShares = data.shares.reduce(
          (acc, { amount }) => acc + amount,
          0,
        );
        return totalShares === data.amount;
      }),
    )
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
        const { processedOriginalShares, processedNewShares } =
          preprocessShares(ctx.expense.shares as ExpenseShare[], input.shares);
        const adjustments = calculateAdjustments(
          processedOriginalShares,
          processedNewShares,
        );

        const balanceUpdates = updateBalances(trx as any, {
          groupId: ctx.expense.groupId,
          shares: adjustments,
        });

        await Promise.all(balanceUpdates);

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
      const shares = ctx.expense.shares as ExpenseShare[];

      // Add the shares back to the user balances, except for the user who created the expense
      const adjustedShares = shares.map((share) => {
        if (share.userId === ctx.session.user.id) {
          return {
            ...share,
            amount: share.amount - ctx.expense.amount,
          };
        }
        return share;
      });

      const balanceUpdates = updateBalances(trx as any, {
        groupId: ctx.expense.groupId,
        shares: adjustedShares,
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
