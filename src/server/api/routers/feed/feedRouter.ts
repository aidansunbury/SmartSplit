// @ts-nocheck Prevent type errors for array access out of bounds
import { desc, eq, type InferSelectModel } from "drizzle-orm";

import { createTRPCRouter, groupProcedure } from "~/server/api/trpc";
import { payments, expenses } from "~/server/db/schema";

export const feedRouter = createTRPCRouter({
  getGroupFeed: groupProcedure.query(async ({ input, ctx }) => {
    const expensesQuery = ctx.db.query.expenses.findMany({
      where: eq(expenses.groupId, input.groupId),
      orderBy: desc(expenses.createdAt),
    });
    const paymentsQuery = ctx.db.query.payments.findMany({
      where: eq(payments.groupId, input.groupId),
      orderBy: desc(payments.createdAt),
    });
    const [expensesResults, paymentsResults] = await Promise.all([
      expensesQuery,
      paymentsQuery,
    ]);

    const feed: Array<
      InferSelectModel<typeof expenses> | InferSelectModel<typeof payments>
    > = [];

    let p = 0;
    let e = 0;
    while (p < paymentsResults.length && e < expensesResults.length) {
      if (paymentsResults[p].createdAt > expensesResults[e].createdAt) {
        feed.push(paymentsResults[p]);
        p++;
      } else {
        feed.push(expensesResults[e]);
        e++;
      }
    }
    while (p < paymentsResults.length) {
      feed.push(paymentsResults[p]);
      p++;
    }
    while (e < expensesResults.length) {
      feed.push(expensesResults[e]);
      e++;
    }

    return feed;
  }),
});
