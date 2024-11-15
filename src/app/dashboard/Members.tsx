"use client";

import { api } from "~/trpc/react";
import { useQueryState } from "nuqs";

export function Members() {
  const [group] = useQueryState("group");
  const { data: members, isLoading } = api.group.get.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!members) {
    return <div>No feed</div>;
  }

  return (
    <div className="border">
      {JSON.stringify(members.users.map((user) => user.user.name))}
    </div>
  );
}
