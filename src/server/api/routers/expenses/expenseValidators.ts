import { createInsertSchema } from "drizzle-zod";
import { expenses } from "~/server/db/schema";

const baseExpenseValidator = createInsertSchema(expenses, {
  amount: (schema) => schema.int().positive(),
  description: (schema) => schema.min(1),
}).omit({
  createdAt: true,
  userId: true,
});

const createExpenseValidator = baseExpenseValidator.omit({
  id: true,
});

const editExpenseValidator = baseExpenseValidator
  .omit({
    groupId: true,
  })
  .partial();

export { createExpenseValidator, editExpenseValidator };
