import React from "react";
import { formatDate } from "~/lib/utils";
import { FeedItem } from "./page";
import { Separator } from "@/components/ui/separator";
import { is } from "drizzle-orm";

// Define the props type, including feedItem and groupMembers
interface FeedSummaryProps {
  feedItem: FeedItem;
  groupMembers: Record<string, Record<string, string>>;
}

const FeedSummary: React.FC<FeedSummaryProps> = ({
  feedItem,
  groupMembers,
}) => {
  // Determine if the feed item is an expense or payment
  let isExpense = true;
  let evenSplit = 0;

  // get the payer and receiver in this expense/payment
  let payerObj: Record<string, string> | undefined;
  let receiverObj: Record<string, string> | undefined;
  if ("userId" in feedItem) {
    payerObj = groupMembers[feedItem.userId];
    isExpense = true;
    evenSplit = Number(
      (feedItem.amount / Object.keys(groupMembers).length).toFixed(2)
    );
  } else if ("fromUserId" in feedItem && "toUserId" in feedItem) {
    payerObj = groupMembers[feedItem.fromUserId];
    receiverObj = groupMembers[feedItem.toUserId];
    isExpense = false;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-end self-end">
        <div className="text-lg font-semibold text-black">
          {feedItem.description || "No description available"}
        </div>
        <div className="text-2xl font-bold text-black">${feedItem.amount}</div>
        <div className="text-sm text-gray-500">
          Added by {payerObj?.name} on {formatDate(feedItem.createdAt)}
        </div>
      </div>
      <Separator />
      <div className="mt-2 self-center">
        {isExpense ? (
          <div className="flex flex-col items-start text-black space-y-2">
            <div className="flex flex-row items-center justify-center space-x-2">
              <img
                src={payerObj?.image}
                alt="payer profile image"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <strong>{payerObj?.name} </strong> paid{" "}
                <strong>${feedItem.amount}</strong>
              </div>
            </div>
            {groupMembers &&
              Object.keys(groupMembers).map(
                (userId) =>
                  userId !== payerObj?.id && (
                    <div
                      key={userId}
                      className="flex flex-row items-center justify-center space-x-2"
                    >
                      <img
                        src={groupMembers[userId]?.image}
                        alt="member profile image"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <strong>{groupMembers[userId]?.name} </strong> owes{" "}
                        <strong>${evenSplit}</strong>
                      </div>
                    </div>
                  )
              )}
          </div>
        ) : (
          <div className="flex flex-col text-sm text-black items-start space-y-2">
            <div className="flex flex-row items-center justify-center space-x-2">
              <img
                src={payerObj?.image}
                alt="payer profile image"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <strong>{payerObj?.name} </strong> paid{" "}
                <strong>${feedItem.amount}</strong>
              </div>
            </div>
            <div className="flex flex-row items-center justify-center space-x-2">
              <img
                src={receiverObj?.image}
                alt="receiver profile image"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <strong>{receiverObj?.name} </strong> received{" "}
                <strong>${feedItem.amount}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedSummary;
