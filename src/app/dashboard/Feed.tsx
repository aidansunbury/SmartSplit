"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "~/trpc/react";
import { useQueryState } from "nuqs";
import Image from "next/image";

export function Feed() {
  const [group, setGroup] = useQueryState("group");
  const { data: feed, isLoading: feedIsLoading } =
    api.feed.getGroupFeed.useQuery(
      { groupId: group as string },
      {
        enabled: group !== null,
      }
    );
  const { data: groupData, isLoading: groupIsLoading } = api.group.get.useQuery(
    { groupId: group as string }
  );
  if (feedIsLoading) {
    return <div>Loading...</div>;
  }
  if (!feed) {
    return <div>No feed</div>;
  }
  if (groupIsLoading) {
    return <div>Loading...</div>;
  }
  if (!groupData) {
    return <div>Cannot find group data</div>;
  }

  // construct a dictionary of user ids to user names in the group
  const groupMembers: Record<string, string> = {};
  groupData.users.forEach((user) => {
    groupMembers[user.user.id] = user.user.name;
  });

  // function that takes a feed createdAt timestamp and returns a formatted date
  function formatDate(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  return (
    <Accordion type="multiple">
      {feed.map((item) => (
        <AccordionItem value={item.id} key={item.id}>
          <AccordionTrigger>
            <div className="flex flex-row justify-between items-center w-full">
              <div className="flex flex-row space-x-3">
                {"userId" in item ? (
                  <Image
                    src="/expense.png"
                    alt="expense icon"
                    width={50}
                    height={50}
                  />
                ) : (
                  <Image
                    src="/payment.png"
                    alt="payment icon"
                    width={50}
                    height={50}
                  />
                )}
                <div className="flex flex-col items-start space-y-2">
                  <div className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>
                  <strong className="text-base text-gray-800">
                    {item.description}
                  </strong>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {"userId" in item ? ( // must be an expense
                  <>
                    {groupMembers[item.userId]} paid ${item.amount}
                  </>
                ) : "toUserId" in item ? ( // must be a payment
                  <>
                    {groupMembers[item.fromUserId]} paid ${item.amount} to{" "}
                    {groupMembers[item.toUserId]}
                  </>
                ) : null}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent></AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
