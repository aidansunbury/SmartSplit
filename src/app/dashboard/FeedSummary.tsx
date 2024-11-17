import React from "react";
import { formatDate } from "~/lib/utils";
import { FeedItem } from "./page";

// Define the props type, including feedItem and groupMembers
interface FeedSummaryProps {
  feedItem: FeedItem;
  groupMembers: Record<string, string>;
}

const FeedSummary: React.FC<FeedSummaryProps> = ({
  feedItem,
  groupMembers,
}) => {
  return (
    <div className="p-4 border rounded shadow-md">
      <div className="text-sm text-gray-500">
        Created At: {formatDate(feedItem.createdAt)}
      </div>
      <div className="text-base font-semibold">
        Description: {feedItem.description || "No description available"}
      </div>
      <div className="mt-2 text-sm text-gray-700">
        Amount: ${feedItem.amount}
      </div>
      <div className="mt-2">
        {("userId" in feedItem && (
          <div>Payer: {groupMembers[feedItem.userId]}</div>
        )) ||
          ("fromUserId" in feedItem && "toUserId" in feedItem && (
            <div>
              From: {groupMembers[feedItem.fromUserId]} To:{" "}
              {groupMembers[feedItem.toUserId]}
            </div>
          ))}
      </div>
      {feedItem.notes && (
        <div className="mt-2 text-sm text-gray-600">
          Notes: {feedItem.notes}
        </div>
      )}
    </div>
  );
};

export default FeedSummary;
