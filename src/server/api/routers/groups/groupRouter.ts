import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { groups, usersToGroups } from "~/server/db/schema";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      safeInsertSchema(groups).omit({
        joinCode: true,
        settledSince: true,
        ownerId: true,
      }),
    )
    .query(async ({ input, ctx }) => {
      const newGroup = await ctx.db.transaction(async (trx) => {
        const [newGroup] = await trx
          .insert(groups)
          .values({
            ...input,
            ownerId: ctx.session.user.id,
          })
          .returning();
        if (!newGroup) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create group",
          });
        }
        const [newGroupMember] = await trx
          .insert(usersToGroups)
          .values({
            groupId: newGroup.id,
            userId: ctx.session.user.id,
          })
          .returning();
        if (!newGroupMember) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to add member to group",
          });
        }
      });

      return newGroup;
    }),
  join: protectedProcedure
    .input(z.object({ joinCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const group = await ctx.db.transaction(async (trx) => {
        const [group] = await trx
          .select()
          .from(groups)
          .where(eq(groups.joinCode, input.joinCode));

        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found for provided join code",
          });
        }

        const [newGroupMember] = await trx
          .insert(usersToGroups)
          .values({
            groupId: group.id,
            userId: ctx.session.user.id,
          })
          .returning();

        if (!newGroupMember) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Unable to add member to group, may already be part of this group",
          });
        }
        return group;
      });
      return group;
    }),
});
