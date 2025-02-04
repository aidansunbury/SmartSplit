"use client";
import { useQueryState } from "nuqs";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { ModeToggle } from "~/components/theme-toggle";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

import { GroupSkeleton } from "./_components/feed/FeedSkeleton";
import { NoGroupsCTA } from "./_components/NoGroupsCTA";

import { GroupView } from "./_components/GroupView";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group] = useQueryState("group");
  const [join, setJoin] = useQueryState("join");
  const { toast } = useToast();
  const { data: groups, isPending: groupsLoading } = api.group.list.useQuery();
  const { data: currentGroup } = api.group.get.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );

  if (join === "success") {
    toast({
      title: "Joined group successfully",
      variant: "default",
    });
    setJoin(null);
  }

  if (join === "error") {
    toast({
      title: "Failed to join group",
      description: "The join code may have changed",
      variant: "destructive",
    });
    setJoin(null);
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex w-full items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="mr-auto ml-4 font-bold text-3xl">
            {currentGroup?.name}
          </h1>
          <ModeToggle />
        </div>
      </header>
      {groupsLoading && !group && <GroupSkeleton />}
      {!groupsLoading && groups?.length === 0 && <NoGroupsCTA />}
      <Suspense fallback={<GroupSkeleton />}>
        {group && <GroupView groupId={group} />}
      </Suspense>
    </div>
  );
}
