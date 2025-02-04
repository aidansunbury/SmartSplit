import { z } from "zod";

import { TRPCError } from "@trpc/server";
import { type InferSelectModel, and, eq } from "drizzle-orm";
import {
  createTRPCRouter,
  groupProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { groups, type users, usersToGroups } from "~/server/db/schema";
import { createGroupSchema } from "./groupValidators";

export type GroupMemberMap = Map<string, InferSelectModel<typeof users>>;

const groupOwnerProcedure = protectedProcedure
  .input(z.object({ groupId: z.string() }))
  .use(async ({ ctx, next, input }) => {
    const group = await ctx.db.query.groups.findFirst({
      where: eq(groups.id, input.groupId),
    });
    if (!group || group.ownerId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Group does not exist or user is not the owner",
      });
    }
    return next({
      ctx: {
        ...ctx,
        group,
      },
    });
  });

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createGroupSchema)
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
              active: true,
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
            orderBy: (userToGroup, { asc }) => [asc(userToGroup.userId)],
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
      // artifical delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const myGroups = await ctx.db.query.usersToGroups.findMany({
        where: and(
          eq(usersToGroups.userId, ctx.session.user.id),
          eq(usersToGroups.active, true),
        ),
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
  // transfer ownership
  // delete
  leave: groupProcedure.mutation(async ({ ctx, input }) => {
    const result = await ctx.db.transaction(async (trx) => {
      // Check the user balance, and ensure they are not the owner
      const group = await trx.query.groups.findFirst({
        where: eq(groups.id, input.groupId),
        with: {
          users: {
            where: eq(usersToGroups.userId, ctx.session.user.id),
          },
        },
      });
      if (group?.ownerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Owner cannot leave group, transfer ownership first",
        });
      }

      if (group?.users[0]?.balance !== 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User must have a balance of 0 to leave group",
        });
      }

      const [updatedUserToGroup] = await trx
        .update(usersToGroups)
        .set({
          active: false,
        })
        .where(
          and(
            eq(usersToGroups.groupId, input.groupId),
            eq(usersToGroups.userId, ctx.session.user.id),
          ),
        )
        .returning();
      if (!updatedUserToGroup) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to leave group",
        });
      }
      return updatedUserToGroup;
    });
    return result;
  }),
});
