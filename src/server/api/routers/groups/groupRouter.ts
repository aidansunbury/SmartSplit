import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { type InferSelectModel, eq } from "drizzle-orm";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { groups, type users, usersToGroups } from "~/server/db/schema";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      safeInsertSchema(groups).omit({
        joinCode: true,
        settledSince: true,
        ownerId: true,
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
        return newGroup;
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
          .onConflictDoUpdate({
            target: [usersToGroups.groupId, usersToGroups.userId],
            set: {
              groupId: group.id,
              userId: ctx.session.user.id,
            },
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
  get: groupProcedure
    .meta({
      description:
        "Get a group by ID, including all users in the group. \n\n Finding the user that corresponds to a given Id is commonly needed on the frontend, so we include a userMap to easily achieve this and to ensure that the operation is not needlessly recalculated.",
    })
    .query(async ({ input, ctx }) => {
      const group = await ctx.db.query.groups.findFirst({
        where: eq(groups.id, input.groupId),
        with: {
          users: {
            with: {
              user: true,
            },
            columns: {
              balance: true,
              groupId: false,
              userId: false,
            },
          },
        },
      });
      const userMap = new Map<string, InferSelectModel<typeof users>>();
      group?.users.forEach((user) => {
        userMap.set(user.user.id, user.user);
      });
      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found",
        });
      }

      return { ...group, userMap };
    }),
  list: protectedProcedure
    .meta({
      description: "List all groups the current user is a member of",
    })
    .query(async ({ ctx }) => {
      const myGroups = await ctx.db.query.usersToGroups.findMany({
        where: eq(usersToGroups.userId, ctx.session.user.id),
        with: {
          group: true,
        },
        columns: {
          balance: true,
          groupId: false,
          userId: false,
        },
        orderBy: (group, { asc }) => [asc(group.groupId)], // Ensure consistent ordering
      });
      return myGroups;
    }),
  refreshJoinCode: groupProcedure.mutation(async ({ ctx, input }) => {
    const newCode = crypto.randomUUID();
    const [group] = await ctx.db
      .update(groups)
      .set({
        joinCode: newCode,
      })
      .where(eq(groups.id, input.groupId))
      .returning();
    if (!group) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh join code",
      });
    }
    return group;
  }),
});
