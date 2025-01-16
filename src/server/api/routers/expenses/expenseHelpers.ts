import { and, eq, sql } from "drizzle-orm";
import type { ExpenseShare as Share } from "~/server/db/schema";

import type { DB } from "~/server/db"; // Todo 3: This type is broken

import { type ExpenseShare, usersToGroups } from "~/server/db/schema";

// Ensures original and new shares are in same order and contain the same users
export function preprocessShares(
  originalShares: Share[],
  newShares: Share[],
): { processedOriginalShares: Share[]; processedNewShares: Share[] } {
  const allUserIds = new Set([
    ...originalShares.map((share) => share.userId),
    ...newShares.map((share) => share.userId),
  ]);

  const processedOriginalShares = Array.from(allUserIds)
    .map((userId) => {
      const originalShare = originalShares.find(
        (share) => share.userId === userId,
      );
      return originalShare || { userId, amount: 0 };
    })
    .sort();

  const processedNewShares = Array.from(allUserIds)
    .map((userId) => {
      const newShare = newShares.find((share) => share.userId === userId);
      return newShare || { userId, amount: 0 };
    })
    .sort();

  return { processedOriginalShares, processedNewShares };
}

export function calculateAdjustments(
  originalShares: Share[],
  newShares: Share[],
): Share[] {
  const totalAmount = originalShares.reduce(
    (sum, share) => sum + share.amount,
    0,
  );

  // Create a map for quick lookup of new share amounts
  const newShareMap = new Map(
    newShares.map((share) => [share.userId, share.amount]),
  );

  return originalShares.map(({ userId, amount: originalAmount }) => {
    const newAmount = newShareMap.get(userId) || 0;
    const originalBalanceChange = totalAmount - originalAmount;
    const newBalanceChange = totalAmount - newAmount;

    const adjustment = newBalanceChange - originalBalanceChange;

    return { userId, amount: adjustment };
  });
}

// Adds provided balances to users
export const updateBalances = (
  trx: DB,
  {
    groupId,
    shares,
  }: {
    groupId: string;
    shares: ExpenseShare[];
  },
) => {
  const balanceUpdates = [];

  for (const share of shares) {
    balanceUpdates.push(
      trx
        .update(usersToGroups)
        .set({
          balance: sql`${usersToGroups.balance} + ${share.amount}`,
        })
        .where(
          and(
            eq(usersToGroups.userId, share.userId),
            eq(usersToGroups.groupId, groupId),
            eq(usersToGroups.active, true),
          ),
        )
        .returning(),
    );
  }
  return balanceUpdates;
};
