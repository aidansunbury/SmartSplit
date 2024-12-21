import { createInsertSchema } from "drizzle-zod";
import { payments } from "~/server/db/schema";

const createPaymentValidator = createInsertSchema(payments, {
  description: (schema) =>
    schema.min(1, { message: "Description is required" }),
  amount: (schema) => schema.int().positive(),
  date: (schema) => schema.int().positive(),
}).omit({
  fromUserId: true,
  createdAt: true,
});

const updatePaymentValidator = createPaymentValidator
  .omit({
    groupId: true,
    toUserId: true,
  })
  .partial();

export { createPaymentValidator, updatePaymentValidator };
