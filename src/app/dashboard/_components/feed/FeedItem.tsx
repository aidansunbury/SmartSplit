"use client";

import { PencilLine } from "lucide-react";
import type React from "react";
import { formatCurrency } from "~/lib/currencyFormat";
import type { RouterOutputs } from "~/server/api/root";
import { api } from "~/trpc/react";
import { DeleteFeedItemDialog } from "./DeleteFeedItemDialog";

interface FeedSummaryProps {
  feedItem: RouterOutputs["feed"]["get"][0];
  groupMembers: Record<string, Record<string, string>>;
}

const UserDisplay = ({
  name,
  image,
  verb,
  amount,
}: { name: string; image: string; verb: string; amount: number }) => {
  return (
    <div className="flex flex-row items-center space-x-2">
      <img
        src={image}
        alt="payer profile"
        width={40}
        height={40}
        className="rounded-full"
      />
      <span className="text-left">
        <strong>{name} </strong> {verb}{" "}
        <strong>{formatCurrency(amount)}</strong>
      </span>
    </div>
  );
};

const FeedSummary: React.FC<FeedSummaryProps> = ({
  feedItem,
  groupMembers,
}) => {
  const { data: me } = api.me.useQuery();
  // Determine if the feed item is an expense or payment
  let isExpense = true;
  let evenSplit = 0;
  let isOwner = false;

  // get the payer and receiver in this expense/payment
  let payerObj: Record<string, string> | undefined;
  let receiverObj: Record<string, string> | undefined;
  if ("userId" in feedItem) {
    payerObj = groupMembers[feedItem.userId];
    isExpense = true;
    evenSplit = Math.floor(feedItem.amount / Object.keys(groupMembers).length);
    isOwner = feedItem.userId === me?.id;
  } else if ("fromUserId" in feedItem && "toUserId" in feedItem) {
    payerObj = groupMembers[feedItem.fromUserId];
    receiverObj = groupMembers[feedItem.toUserId];
    isExpense = false;
    isOwner = feedItem.fromUserId === me?.id;
  }

  function renderPayment() {
    if (isExpense) {
      return (
        <>
          <UserDisplay
            name={payerObj?.name}
            image={payerObj?.image}
            verb="lent"
            amount={evenSplit * (Object.keys(groupMembers).length - 1)}
          />
          {groupMembers &&
            Object.keys(groupMembers).map(
              (userId) =>
                userId !== payerObj?.id && (
                  <UserDisplay
                    key={userId}
                    name={groupMembers[userId].name}
                    image={groupMembers[userId].image}
                    verb="owes"
                    amount={evenSplit}
                  />
                ),
            )}
        </>
      );
    }
    return (
      <>
        <UserDisplay
          name={payerObj?.name}
          image={payerObj?.image}
          verb="paid"
          amount={feedItem.amount}
        />
        <UserDisplay
          name={receiverObj?.name}
          image={receiverObj?.image}
          verb="received"
          amount={feedItem.amount}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row-reverse">
      <div className="relative border lg:w-1/2">
        {feedItem.notes}{" "}
        {isOwner && (
          <div className="absolute top-2 right-2 flex flex-row space-x-2">
            <PencilLine size={20} />
            <DeleteFeedItemDialog
              itemType={isExpense ? "expense" : "payment"}
              itemDescription={feedItem.description}
              itemId={feedItem.id}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col space-y-1 lg:w-1/2">{renderPayment()}</div>
    </div>
  );
};

export default FeedSummary;
