"use client";
import { useQueryState } from "nuqs";

import { useDebounce } from "@uidotdev/usehooks";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { AddExpense } from "./_components/AddExpense";
import { AddPayment } from "./_components/AddPayment";
import { Members } from "./_components/Members";
import SearchBar from "./_components/SearchBar";
import { Feed } from "./_components/feed/Feed";

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group, _setGroup] = useQueryState("group");
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

  if (feedIsLoading || groupIsLoading) {
    return <div>Loading...</div>;
  }
  if (!groupData) {
    return <div>Group does not exist or you are not added to this group</div>;
  }
  if (!feed) {
    return <div>No feed</div>;
  }

  // TODO this should be moved to the server
  // Construct a dictionary of user ids to user names in the group
  const groupMembers: Record<string, Record<string, string>> = {};
  groupData.users.forEach((user) => {
    groupMembers[user.user.id] = {
      id: user.user.id,
      name: user.user.name,
      image: user.user.image || "",
    };
  });

  return (
    <div>
      <h1 className="font-bold text-2xl xl:pl-16">{groupData.name}</h1>
      <div className="flex min-h-screen flex-col-reverse justify-center overflow-hidden lg:flex-row">
        {/* Main content area */}
        <div className="w-full max-w-[600px] p-4">
          <div className="text-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="space-x-2">
              <AddExpense />
              <AddPayment />
              {/* //Todo Invite Group member */}
            </div>
            <Feed
              filteredResult={filteredFeedItems}
              groupMembers={groupMembers}
            />
          </div>
        </div>

        {/* Right gutter */}
        <div className="w-56 p-4 shadow-xl lg:h-auto lg:w-1/4 lg:flex-none">
          <Members />
        </div>
      </div>
    </div>
  );
}
