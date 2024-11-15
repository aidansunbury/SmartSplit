import type { Table } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Ensures that userIds must come from the auth context, and the id and createdAt columns are automatically set by the database
export function safeInsertSchema<TTable extends Table>(table: TTable) {
  return createInsertSchema(table).omit({
    userId: true,
    id: true,
    createdAt: true,
  });
}
