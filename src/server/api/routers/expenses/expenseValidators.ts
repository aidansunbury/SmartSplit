import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
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

//! Refinements are not working on group procedures
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

const editExpenseValidator = baseExpenseValidator
  .omit({
    groupId: true,
  })
  .partial()
  .refine((data) => {
    if (!data.shares) {
      return true;
    }
    // Ensure shares and total are equal
    const totalShares = data.shares.reduce(
      (acc, { amount }) => acc + amount,
      0,
    );
    if (totalShares !== data.amount) {
      return false;
    }
    return true;
  });

export { createExpenseValidator, editExpenseValidator };
