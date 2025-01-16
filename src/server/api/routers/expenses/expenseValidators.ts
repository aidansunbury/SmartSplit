import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { expenses } from "~/server/db/schema";

const shareValidator = z.object({
  shares: z
    .object({
      userId: z.string(),
      amount: z.number().int().positive(),
    })
    .array()
    .min(2),
});

const baseExpenseValidator = createInsertSchema(expenses, {
  amount: (schema) => schema.int().positive(),
  description: (schema) => schema.min(1),
  date: (schema) => schema.int().positive(),
})
  .merge(shareValidator)
  .omit({
    createdAt: true,
    userId: true,
  });

//! Refinements are not working on group procedures with trpc-ui
// TODO enable this before deploying
const createExpenseValidator = baseExpenseValidator.omit({
  id: true,
});
// .refine((data) => {
//   // Ensure shares and total are equal
//   const totalShares = data.shares.reduce(
//     (acc, { amount }) => acc + amount,
//     0,
//   );
//   if (totalShares !== data.amount) {
//     return false;
//   }
//   return true;
// });

//! Refinements are not working on group procedures with trpc-ui
// TODO enable this before deploying
//* Since data will be pre-filled from the frontend, we can make all fields required
const editExpenseValidator = baseExpenseValidator.omit({
  groupId: true,
});
// .refine((data) => {
//   // Ensure shares and total are equal
//   const totalShares = data.shares.reduce(
//     (acc, { amount }) => acc + amount,
//     0,
//   );
//   if (totalShares !== data.amount) {
//     return false;
//   }
//   return true;
// });

export { createExpenseValidator, editExpenseValidator };
