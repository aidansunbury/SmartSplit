"use client";

import { AvatarImage } from "@radix-ui/react-avatar";
import { useQueryState } from "nuqs";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/currencyFormat";
import { api } from "~/trpc/react";

export function Members() {
  const [group] = useQueryState("group");
  const { data: groupWithMembers, isLoading } = api.group.get.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!groupWithMembers) {
    return <div>No feed</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="font-bold text-l">{groupWithMembers.name}</h1>
      {groupWithMembers.users.map((user) => {
        const isNegative = user.balance < 0;

        return (
          <div
            className="flex flex-row items-center space-x-4"
            key={user.user.id}
          >
            <Avatar>
              <AvatarImage src={user.user.image ?? undefined} />
            </Avatar>
            <div className="flex flex-col">
              <h2 className="font-medium">{user.user.name}</h2>
              <div
                className={`${isNegative ? "text-orange-500" : "text-green-500"} text-sm`}
              >
                <span className="text-sm">
                  {isNegative ? "owes" : "gets back"}
                </span>
                <span className="ml-1 font-bold text-lg">
                  {formatCurrency(user.balance)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      {/* View Details Button? */}
      <Button variant="link" size="sm" className="text-blue-500">
        View Details
      </Button>
    </div>
  );
}
