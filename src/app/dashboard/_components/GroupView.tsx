"use client";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { Suspense } from "react";
import { api } from "~/trpc/react";

import { useDebounce } from "@uidotdev/usehooks";
import { AddExpense } from "./AddExpense";
import { AddPayment } from "./AddPayment";
import { GroupInfoPanel } from "./GroupInfoPanel";
import SearchBar from "./SearchBar";
import { SettingsDialog } from "./SettingsDialog";
import { Feed } from "./feed/Feed";
import { FeedSkeleton } from "./feed/FeedSkeleton";

export const GroupView = ({ groupId }: { groupId: string }) => {
  const [group] = api.group.get.useSuspenseQuery({
    groupId: groupId as string,
  });

  const { data: feed, isLoading: feedIsLoading } = api.feed.get.useQuery({
    groupId: groupId,
  });
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
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
  return (
    <>
      <div className="my-2 flex flex-col-reverse justify-center overflow-hidden lg:flex-row lg:space-x-2">
        <div className="w-full rounded-b-lg bg-accent p-4 lg:max-w-[600px] lg:rounded-lg">
          <div className="text-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="space-x-2">
              <AddExpense />
              <AddPayment />
            </div>
            {feedIsLoading ? (
              <FeedSkeleton />
            ) : (
              <Feed
                filteredResult={filteredFeedItems}
                groupMembers={group.userMap}
              />
            )}
          </div>
        </div>

        <div className="h-fit w-full rounded-t-lg bg-accent p-4 lg:w-1/4 lg:flex-none lg:rounded-lg">
          <Suspense fallback={<div>Loading...</div>}>
            <GroupInfoPanel />
          </Suspense>
        </div>
      </div>
      <SettingsDialog />
    </>
  );
};
