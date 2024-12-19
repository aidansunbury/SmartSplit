"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { formatCurrency } from "~/lib/currencyFormat";
import { formatDate } from "~/lib/utils";
import FeedSummary from "./FeedSummary";
import type { FeedItem } from "./page";

interface FeedProps {
  filteredResult: FeedItem[];
  groupMembers: Record<string, Record<string, string>>;
}
const Feed: React.FC<FeedProps> = ({ filteredResult, groupMembers }) => {
  return (
    <div>
      <Accordion type="multiple">
        {filteredResult.map((item) => (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger>
              <div className="flex w-full flex-row items-center justify-between">
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
                    <div className="text-gray-500 text-sm">
                      {formatDate(item.createdAt)}
                    </div>
                    <strong className="text-base">{item.description}</strong>
                  </div>
                </div>

                <div className=" text-sm">
                  {"userId" in item ? ( // Expense
                    <>
                      {groupMembers[item.userId]?.name} paid{" "}
                      {formatCurrency(item.amount)}
                    </>
                  ) : "toUserId" in item ? ( // Payment
                    <>
                      {groupMembers[item.fromUserId]?.name} paid{" "}
                      {formatCurrency(item.amount)} to{" "}
                      {groupMembers[item.toUserId]?.name}
                    </>
                  ) : null}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FeedSummary feedItem={item} groupMembers={groupMembers} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Feed;
