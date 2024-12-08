import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { protectedProcedure } from "~/server/api/trpc";
import { balancesRouter } from "./routers/balances/balancesRouter";
import { expenseRouter } from "./routers/expenses/expenseRouter";
import { feedRouter } from "./routers/feed/feedRouter";
import { groupRouter } from "./routers/groups/groupRouter";
import { paymentsRouter } from "./routers/payments/paymentsRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  group: groupRouter,
  payments: paymentsRouter,
  balance: balancesRouter,
  expense: expenseRouter,
  feed: feedRouter,
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.session.user;
  }), // This is because I'm lazy, and just want to be able to use react-query for getting the session in client components
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
