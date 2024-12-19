import type React from "react";
import { formatCurrency } from "~/lib/currencyFormat";
import type { FeedItem } from "./page";

// Define the props type, including feedItem and groupMembers
interface FeedSummaryProps {
  feedItem: FeedItem;
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
      (feedItem.amount / Object.keys(groupMembers).length).toFixed(2),
    );
  } else if ("fromUserId" in feedItem && "toUserId" in feedItem) {
    payerObj = groupMembers[feedItem.fromUserId];
    receiverObj = groupMembers[feedItem.toUserId];
    isExpense = false;
  }

  function renderPayment() {
    if (isExpense) {
      return (
        <>
          <UserDisplay
            name={payerObj?.name}
            image={payerObj?.image}
            verb="paid"
            amount={feedItem.amount}
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
      <div className="lg:w-1/2">{feedItem.notes}</div>
      <div className="flex flex-col space-y-1 lg:w-1/2">{renderPayment()}</div>
    </div>
  );
};

export default FeedSummary;
