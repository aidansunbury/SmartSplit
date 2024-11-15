import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { createTRPCRouter, groupProcedure } from "~/server/api/trpc";
import { payments, usersToGroups } from "~/server/db/schema";

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
  // getPaymentWithComments:
});
