import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { payments, usersToGroups } from "~/server/db/schema";
import { z } from "zod";

const paymentOwnerProcedure = protectedProcedure
  .input(z.object({ paymentId: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const [payment] = await ctx.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.id, input.paymentId),
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

export const paymentsRouter = createTRPCRouter({
  create: groupProcedure
    .input(safeInsertSchema(payments).omit({ fromUserId: true }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.transaction(async (trx) => {
        // Record the payment
        const newPaymentPromise = trx
          .insert(payments)
          .values({ ...input, fromUserId: ctx.session.user.id })
          .returning();

        // Update the balances
        const updatedPayeeBalancePromise = trx
          .update(usersToGroups)
          .set({
            balance: sql`${usersToGroups.balance} - ${input.amount}`,
          })
          .where(
            and(
              eq(usersToGroups.groupId, input.groupId),
              eq(usersToGroups.userId, input.toUserId),
            ),
          )
          .returning();

        const updatedPayerBalancePromise = trx
          .update(usersToGroups)
          .set({
            balance: sql`${usersToGroups.balance} + ${input.amount}`,
          })
          .where(
            and(
              eq(usersToGroups.groupId, input.groupId),
              eq(usersToGroups.userId, ctx.session.user.id),
            ),
          )
          .returning();

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
  delete: paymentOwnerProcedure.mutation(async ({ ctx, input }) => {
    const payment = await ctx.db.transaction(async (trx) => {
      // Update the balances
      const updatedPayeeBalancePromise = trx
        .update(usersToGroups)
        .set({
          balance: sql`${usersToGroups.balance} + ${ctx.payment.amount}`,
        })
        .where(
          and(
            eq(usersToGroups.groupId, ctx.payment.groupId),
            eq(usersToGroups.userId, ctx.payment.toUserId),
          ),
        )
        .returning();

      const updatedPayerBalancePromise = trx
        .update(usersToGroups)
        .set({
          balance: sql`${usersToGroups.balance} - ${ctx.payment.amount}`,
        })
        .where(
          and(
            eq(usersToGroups.groupId, ctx.payment.groupId),
            eq(usersToGroups.userId, ctx.payment.fromUserId),
          ),
        )
        .returning();

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
