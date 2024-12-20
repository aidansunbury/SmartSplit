"use client";

import { AvatarImage } from "@radix-ui/react-avatar";
import { Crown, Settings, UserPlus } from "lucide-react";
import { useQueryState } from "nuqs";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { formatCurrency } from "~/lib/currencyFormat";
import { api } from "~/trpc/react";
import { SettingsDialog } from "./SettingsDialog";

export function GroupInfoPanel() {
  const [group] = useQueryState("group");
  const [settings, setSettings] = useQueryState("settings");
  const [groupWithMembers] = api.group.get.useSuspenseQuery({
    groupId: group as string,
  });

  return (
    <div className="flex w-full flex-col space-y-4 ">
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
      <Button
        variant={"ghost"}
        className="border"
        onClick={() => setSettings("invite")}
      >
        <UserPlus className="h-6 w-6" />
        <p>invite people</p>
      </Button>
      <Button
        variant={"ghost"}
        className="border"
        onClick={() => setSettings("general")}
      >
        <Settings className="h-6 w-6" />
        <p>settings</p>
      </Button>

      <SettingsDialog />
    </div>
  );
}
