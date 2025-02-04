"use client";

import clsx from "clsx";
import { Crown, Settings, UserPlus } from "lucide-react";
import { useQueryState } from "nuqs";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/currencyFormat";
import { api } from "~/trpc/react";

export function GroupInfoPanel() {
  const [group] = useQueryState("group");
  const [_settings, setSettings] = useQueryState("settings");
  const [groupWithMembers] = api.group.get.useSuspenseQuery({
    groupId: group as string,
  });

  return (
    <div className="flex w-full flex-row space-y-4 lg:flex-col ">
      <div className="w-1/2 lg:w-full">
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
                <span className="flex items-center space-x-2">
                  <h2 className="font-medium">{user.user.name}</h2>
                  {user.user.id === groupWithMembers.ownerId && (
                    <Crown className="h-6 w-6 text-yellow-500" />
                  )}
                </span>
                <div
                  className={clsx(
                    "text-sm",
                    isNegative ? "text-destructive" : "text-success",
                  )}
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
      </div>
      <div className="w-1/2 space-y-2 lg:w-full">
        <Button
          variant={"outline"}
          className="w-full justify-start"
          onClick={() => setSettings("invite")}
        >
          <UserPlus size={20} className="mr-2" />
          Invite Members
        </Button>
        <Button
          variant={"outline"}
          className="w-full justify-start"
          onClick={() => setSettings("general")}
        >
          <Settings className="h-6 w-6" />
          Group Settings
        </Button>
      </div>
    </div>
  );
}
