"use client";
import { useQueryState } from "nuqs";

import { useDebounce } from "@uidotdev/usehooks";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { Suspense } from "react";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { AddExpense } from "./_components/AddExpense";
import { AddPayment } from "./_components/AddPayment";
import { GroupInfoPanel } from "./_components/GroupInfoPanel";
import SearchBar from "./_components/SearchBar";
import { SettingsDialog } from "./_components/SettingsDialog";
import { Feed } from "./_components/feed/Feed";
import { FeedSkeleton, GroupSkeleton } from "./_components/feed/FeedSkeleton";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group] = useQueryState("group");
  const [join, setJoin] = useQueryState("join");
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: feed, isLoading: feedIsLoading } = api.feed.get.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );
  const { data: groupData, isLoading: groupIsLoading } = api.group.get.useQuery(
    { groupId: group as string },
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

  const filteredFeedItems = useMemo(() => {
    if (!feed) {
      return [];
    }
    return debouncedSearchTerm.length > 0
      ? fuzzysort
          .go(debouncedSearchTerm, feed, {
            keys: ["description", "notes"],
          })
          .map((result) => result.obj)
      : feed;
  }, [feed, debouncedSearchTerm]);

  if (groupIsLoading) {
    return <GroupSkeleton />;
  }
  if (!groupData) {
    return <div>Group does not exist or you are not added to this group</div>;
  }

  return (
    <div>
      <h1 className="font-bold text-2xl xl:pl-16">{groupData.name}</h1>
      <div className="my-2 flex flex-col-reverse justify-center overflow-hidden lg:flex-row lg:space-x-2">
        {/* Main content area */}
        <div className="w-full rounded-b-lg bg-accent p-4 lg:max-w-[600px] lg:rounded-lg">
          <div className="text-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="space-x-2">
              <AddExpense />
              <AddPayment />
              {/* //Todo Invite Group member */}
            </div>
            {feedIsLoading ? (
              <FeedSkeleton />
            ) : (
              <Feed
                filteredResult={filteredFeedItems}
                groupMembers={groupData.userMap}
              />
            )}
          </div>
        </div>

        {/* Right gutter */}
        <div className="h-fit w-full rounded-t-lg bg-accent p-4 lg:w-1/4 lg:flex-none lg:rounded-lg">
          <Suspense fallback={<div>Loading...</div>}>
            <GroupInfoPanel />
          </Suspense>
        </div>
      </div>
      <SettingsDialog />
    </div>
  );
}
