import { createInsertSchema } from "drizzle-zod";
import { groups } from "~/server/db/schema";

export const createGroupSchema = createInsertSchema(groups, {
  name: (schema) => schema.min(1),
}).omit({
  joinCode: true,
  settledSince: true,
  ownerId: true,
});
