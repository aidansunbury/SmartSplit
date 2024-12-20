"use client";

import type React from "react";
import { PaymentMethodIconMap } from "~/components/BrandIcons";
import { CategoryIconMap } from "~/components/ExpenseCategoryIcons";
import { formatCurrency } from "~/lib/currencyFormat";
import type { RouterOutputs } from "~/server/api/root";
import type { GroupMemberMap } from "~/server/api/routers/groups/groupRouter";
import { api } from "~/trpc/react";
import { EditExpense } from "../EditExpense";
import { EditPayment } from "../EditPayment";
import { DeleteFeedItemDialog } from "./DeleteFeedItemDialog";

interface FeedSummaryProps {
  feedItem: RouterOutputs["feed"]["get"][0];
  groupMembers: GroupMemberMap;
}

const UserDisplay = ({
  name,
  image,
  verb,
  amount,
}: { name: string; image: string | null; verb: string; amount: number }) => {
  return (
    <div className="flex flex-row items-center space-x-2">
      <img
        src={image ?? ""}
        alt="profile"
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

export const FeedItem: React.FC<FeedSummaryProps> = ({
  feedItem,
  groupMembers,
}) => {
  const { data: me } = api.me.useQuery();
  if ("userId" in feedItem) {
    //* FeedItem is an Expense
    const isOwner = feedItem.userId === me?.id;
    const payerObj = groupMembers.get(feedItem.userId);
    const evenSplit = Math.floor(feedItem.amount / groupMembers.size);

    if (!payerObj) {
      return null;
    }
    return (
      <div className="flex flex-col lg:flex-row-reverse">
        <div className="relative lg:w-1/2 ">
          {isOwner && (
            <div className="float-right mt-2 mr-2 mb-2 ml-2 flex gap-2">
              <EditExpense expense={feedItem} />

              <DeleteFeedItemDialog
                itemType={"expense"}
                itemDescription={feedItem.description}
                itemId={feedItem.id}
              />
            </div>
          )}
          <div className="space-y-2 text-left">
            {feedItem.notes && (
              <div>
                <h3 className="font-semibold text-lg">Notes</h3>
                <p>{feedItem.notes}</p>
              </div>
            )}
            {feedItem.category && (
              <div>
                <h3 className="font-semibold text-lg">Category</h3>
                <div className="flex flex-row items-center space-x-1">
                  <div className="flex h-10 w-10 items-center justify-center">
                    {CategoryIconMap.get(feedItem.category)}
                  </div>
                  <span className="font-semibold text-base">
                    {feedItem.category.charAt(0).toUpperCase() +
                      feedItem.category.slice(1)}{" "}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-1 lg:w-1/2">
          <UserDisplay
            name={payerObj?.name}
            image={payerObj?.image ?? ""}
            verb="lent"
            amount={evenSplit * (groupMembers.size - 1)}
          />
          {groupMembers &&
            Array.from(groupMembers).map(
              ([id, member]) =>
                id !== payerObj?.id && (
                  <UserDisplay
                    key={id}
                    name={member.name}
                    image={member.image}
                    verb="owes"
                    amount={evenSplit}
                  />
                ),
            )}
        </div>
      </div>
    );
  }
  const isOwner = feedItem.fromUserId === me?.id;

  const payerObj = groupMembers.get(feedItem.fromUserId);
  const receiverObj = groupMembers.get(feedItem.toUserId);

  if (!payerObj || !receiverObj) {
    return null;
  }

  //* Payment
  return (
    <div className="flex flex-col lg:flex-row-reverse">
      <div className="relative lg:w-full">
        {isOwner && (
          <div className="float-right mt-2 mr-2 mb-2 ml-2 flex gap-2">
            <EditPayment payment={feedItem} />

            <DeleteFeedItemDialog
              itemType={"payment"}
              itemDescription={feedItem.description}
              itemId={feedItem.id}
            />
          </div>
        )}

        <div className="space-y-2 text-left">
          {feedItem.notes && (
            <div>
              <h3 className="font-semibold text-lg">Notes</h3>
              <p>{feedItem.notes}</p>
            </div>
          )}
          {feedItem.paymentMethod && (
            <div>
              <h3 className="font-semibold text-lg">Payment Method</h3>

              <div className="flex flex-row items-center space-x-1">
                <div className="flex h-10 w-10 items-center justify-center">
                  {PaymentMethodIconMap.get(feedItem.paymentMethod)}
                </div>
                <span className="font-semibold text-base">
                  {feedItem.paymentMethod}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col space-y-1 lg:w-full">
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
      </div>
    </div>
  );
};
