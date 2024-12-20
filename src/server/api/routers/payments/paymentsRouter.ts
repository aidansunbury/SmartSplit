import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import type { DB } from "~/server/db";
import { payments, usersToGroups } from "~/server/db/schema";
import {
  createPaymentValidator,
  updatePaymentValidator,
} from "./paymentValidators";

const paymentOwnerProcedure = protectedProcedure
  .input(z.object({ id: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const [payment] = await ctx.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, input.id),
          eq(payments.fromUserId, ctx.session.user.id),
        ),
      );
    if (!payment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Payment does not exist or user is not the owner",
      });
    }
    return next({
      ctx: {
        ...ctx,
        payment,
      },
    });
  });

const updateBalancesFromPayment = async ({
  trx,
  amount,
  groupId,
  balanceIncreaseUserId,
  balanceDecreaseUserId,
}: {
  trx: DB;
  amount: number;
  groupId: string;
  balanceIncreaseUserId: string;
  balanceDecreaseUserId: string;
}) => {
  const increaseBalancePromise = trx
    .update(usersToGroups)
    .set({
      balance: sql`${usersToGroups.balance} + ${amount}`,
    })
    .where(
      and(
        eq(usersToGroups.groupId, groupId),
        eq(usersToGroups.userId, balanceIncreaseUserId),
      ),
    )
    .returning();

  const decreaseBalancePromise = trx
    .update(usersToGroups)
    .set({
      balance: sql`${usersToGroups.balance} - ${amount}`,
    })
    .where(
      and(
        eq(usersToGroups.groupId, groupId),
        eq(usersToGroups.userId, balanceDecreaseUserId),
      ),
    )
    .returning();

  return [increaseBalancePromise, decreaseBalancePromise] as const;
};

export const paymentsRouter = createTRPCRouter({
  create: groupProcedure
    .meta({
      description: "Record a payment. You can only record your own payments.",
    })
    .input(createPaymentValidator)
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.transaction(async (trx) => {
        // Record the payment
        const newPaymentPromise = trx
          .insert(payments)
          .values({ ...input, fromUserId: ctx.session.user.id })
          .returning();

        // Update the balances
        const [updatedPayeeBalancePromise, updatedPayerBalancePromise] =
          await updateBalancesFromPayment({
            trx,
            amount: input.amount,
            groupId: input.groupId,
            balanceIncreaseUserId: ctx.session.user.id,
            balanceDecreaseUserId: input.toUserId,
          });

        const [[newPayment], _updatedPayeeBalance, _updatedPayerBalance] =
          await Promise.all([
            newPaymentPromise,
            updatedPayeeBalancePromise,
            updatedPayerBalancePromise,
          ]);
        if (!newPayment) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create payment",
          });
        }
        return newPayment;
      });
      return payment;
    }),
  edit: paymentOwnerProcedure
    .meta({
      description:
        "Edit a payment. Only the creator of a payment can edit it. The payment group and recipient can not be changed.",
    })
    .input(updatePaymentValidator)
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.transaction(async (trx) => {
        // Update the payment
        const updatedPaymentPromise = trx
          .update(payments)
          .set(input)
          .where(
            and(
              eq(payments.id, ctx.payment.id),
              eq(payments.fromUserId, ctx.session.user.id),
            ),
          )
          .returning();
        if (input.amount !== undefined && input.amount !== ctx.payment.amount) {
          const difference = input.amount - ctx.payment.amount;

          const [increaseBalancePromise, decreaseBalancePromise] =
            difference > 0
              ? await updateBalancesFromPayment({
                  trx,
                  amount: difference,
                  groupId: ctx.payment.groupId,
                  balanceIncreaseUserId: ctx.payment.fromUserId,
                  balanceDecreaseUserId: ctx.payment.toUserId,
                })
              : await updateBalancesFromPayment({
                  trx,
                  amount: -difference,
                  groupId: ctx.payment.groupId,
                  balanceIncreaseUserId: ctx.payment.toUserId,
                  balanceDecreaseUserId: ctx.payment.fromUserId,
                });
          await Promise.all([increaseBalancePromise, decreaseBalancePromise]);
        }

        const [updatedPayment] = await updatedPaymentPromise;
        if (!updatedPayment) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update payment",
          });
        }
        return updatedPayment;
      });
      return payment;
    }),
  delete: paymentOwnerProcedure.mutation(async ({ ctx }) => {
    const payment = await ctx.db.transaction(async (trx) => {
      // Update the balances
      const [updatedPayeeBalancePromise, updatedPayerBalancePromise] =
        await updateBalancesFromPayment({
          trx,
          amount: ctx.payment.amount,
          groupId: ctx.payment.groupId,
          balanceIncreaseUserId: ctx.payment.toUserId,
          balanceDecreaseUserId: ctx.payment.fromUserId,
        });

      // Delete the payment
      const deletedPaymentPromise = trx
        .delete(payments)
        .where(eq(payments.id, ctx.payment.id))
        .returning();

      const [_updatedPayeeBalance, _updatedPayerBalance, [deletedPayment]] =
        await Promise.all([
          updatedPayeeBalancePromise,
          updatedPayerBalancePromise,
          deletedPaymentPromise,
        ]);
      if (!deletedPayment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete payment",
        });
      }
      return deletedPayment;
    });
    return payment;
  }),
  // getPaymentWithComments:
});
