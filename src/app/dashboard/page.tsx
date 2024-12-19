"use client";
import { useQueryState } from "nuqs";

import { useState } from "react";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { AddExpense } from "./AddExpense";
import { AddPayment } from "./AddPayment";
import Feed from "./Feed";
import { Members } from "./Members";
import SearchBar from "./SearchBar";

export type FeedItem =
  | {
      id: string;
      description: string | null;
      userId: string;
      groupId: string;
      amount: number;
      notes: string | null;
      createdAt: number;
    }
  | {
      id: string;
      description: string | null;
      groupId: string;
      amount: number;
      notes: string | null;
      createdAt: number;
      fromUserId: string;
      toUserId: string;
    };

// If the user is not a part of any groups, CTA to create or join
export default function DashboardPage() {
  const [group, _setGroup] = useQueryState("group");
  const [join, setJoin] = useQueryState("join");
  const { toast } = useToast();

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

  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  const { data: feed, isLoading: feedIsLoading } =
    api.feed.getGroupFeed.useQuery(
      { groupId: group as string },
      {
        enabled: group !== null,
      },
    );
  const { data: groupData, isLoading: groupIsLoading } = api.group.get.useQuery(
    { groupId: group as string },
  );

  if (feedIsLoading || groupIsLoading) {
    return <div>Loading...</div>;
  }
  if (!groupData) {
    return <div>Group does not exist or you are not added to this group</div>;
  }
  if (!feed) {
    return <div>No feed</div>;
  }

  // Construct a dictionary of user ids to user names in the group
  const groupMembers: Record<string, Record<string, string>> = {};
  groupData.users.forEach((user) => {
    groupMembers[user.user.id] = {
      id: user.user.id,
      name: user.user.name,
      image: user.user.image || "",
    };
  });

  // Filter feed items based on the search term (description and member names)
  const filteredFeedItems = feed.filter((item) => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    // Match description or any user-related fields (userId, fromUserId, toUserId)
    const matchesDescription = item.description
      ?.toLowerCase()
      .includes(lowercasedSearchTerm);

    const matchesUserName =
      "userId" in item &&
      groupMembers[item.userId]?.name
        ?.toLowerCase()
        .includes(lowercasedSearchTerm);

    const matchesPaymentNames =
      "fromUserId" in item &&
      "toUserId" in item &&
      (groupMembers[item.fromUserId]?.name
        ?.toLowerCase()
        .includes(lowercasedSearchTerm) ||
        groupMembers[item.toUserId]?.name
          ?.toLowerCase()
          .includes(lowercasedSearchTerm));

    return matchesDescription || matchesUserName || matchesPaymentNames;
  });

  return (
    <div>
      <div />
      <h1 className="font-bold text-2xl xl:pl-16">{groupData.name}</h1>
      <div className="flex min-h-screen flex-col-reverse justify-center overflow-hidden lg:flex-row">
        {/* Main content area */}
        <div className="w-full max-w-[600px] p-4">
          <div className="text-center">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div>
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
