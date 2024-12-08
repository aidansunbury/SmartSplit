"use client";

import { AvatarImage } from "@radix-ui/react-avatar";
import { useQueryState } from "nuqs";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function Members() {
  const [group] = useQueryState("group");
  const { data: members, isLoading } = api.group.get.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );
  // Dummy Data
  // const members = dummyMembers;
  // const isLoading = false;
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!members) {
    return <div>No feed</div>;
  }

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="font-bold text-l">Group Members</h1>
      {members.users.map((user) => {
        const isNegative = user.balance < 0;

        return (
          <div
            className="flex flex-row items-center space-x-4"
            key={user.user.id}
          >
            <Avatar>
              <AvatarImage src={user.user.image} />
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
                  ${Math.abs(user.balance)}
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

const dummyMembers = {
  id: "group1",
  name: "Book Club",
  description: "Epic book club",
  settledSince: 2020,
  ownerId: "user3",
  joinCode: "BOOK5678",
  users: [
    {
      balance: 100.0,
      user: {
        id: "user3",
        name: "Carol Williams",
        email: "carol.williams@example.com",
        emailVerified: new Date("2024-01-25"),
        image: "https://picsum.photos/200",
      },
    },
    {
      balance: -15.25,
      user: {
        id: "user4",
        name: "David Brown",
        email: "david.brown@example.com",
        emailVerified: null,
        image: "https://picsum.photos/200",
      },
    },
    {
      balance: 5.0,
      user: {
        id: "user5",
        name: "Eve Taylor",
        email: "eve.taylor@example.com",
        emailVerified: new Date("2024-10-10"),
        image: "https://picsum.photos/200",
      },
    },
  ],
};
