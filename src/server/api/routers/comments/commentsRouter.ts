import { z } from "zod";

import { createTRPCRouter, groupProcedure } from "~/server/api/trpc";
import { usersToGroups } from "~/server/db/schema";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const commentsRouter = createTRPCRouter({
  // Create comment
});
