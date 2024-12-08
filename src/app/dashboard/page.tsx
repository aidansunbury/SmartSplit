"use client";
import { useQueryState } from "nuqs";

import { useState } from "react";
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
  const [group, setGroup] = useQueryState("group");
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
    <div className="flex min-h-screen justify-center overflow-hidden">
      {/* Main content area */}
      <div className="w-full max-w-[600px] p-4">
        <div className="text-center text-gray-600">
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
      <div className="w-56 p-4 shadow-xl">
        <div className="text-pretty text-gray-600">
          <Members />
        </div>
      </div>
    </div>
  );
}
