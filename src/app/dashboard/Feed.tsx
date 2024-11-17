"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useQueryState } from "nuqs";
import Image from "next/image";
import FeedSummary from "./FeedSummary";
import { formatDate } from "~/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { FeedItem } from "./page";

interface FeedProps {
  filteredResult: FeedItem[];
  groupMembers: Record<string, string>;
}
const Feed: React.FC<FeedProps> = ({ filteredResult, groupMembers }) => {
  return (
    <div>
      <Accordion type="multiple">
        {filteredResult.map((item) => (
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
                  {"userId" in item ? ( // Expense
                    <>
                      {groupMembers[item.userId]} paid ${item.amount}
                    </>
                  ) : "toUserId" in item ? ( // Payment
                    <>
                      {groupMembers[item.fromUserId]} paid ${item.amount} to{" "}
                      {groupMembers[item.toUserId]}
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
