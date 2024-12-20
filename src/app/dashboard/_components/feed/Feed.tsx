"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CircleDollarSign, HandCoins } from "lucide-react";
import { formatCurrency } from "~/lib/currencyFormat";
import { formatDate } from "~/lib/utils";
import FeedSummary from "./FeedItem";
import type { RouterOutputs } from "~/server/api/root";

type Feed = RouterOutputs["feed"]["get"];
interface FeedProps {
  filteredResult: Feed;
  groupMembers: Record<string, Record<string, string>>;
}
export const Feed: React.FC<FeedProps> = ({ filteredResult, groupMembers }) => {
  return (
    <div>
      <Accordion type="multiple">
        {filteredResult.map((item) => (
          <AccordionItem value={item.id} key={item.id}>
            <AccordionTrigger>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex flex-row space-x-3">
                  {"userId" in item ? (
                    <CircleDollarSign size={40} />
                  ) : (
                    <HandCoins size={40} />
                  )}
                  <div className="flex flex-col items-start space-y-2">
                    <div className="text-gray-500 text-sm">
                      {formatDate(item.createdAt)}
                    </div>
                    <span className="text-lg font-semibold text-left">
                      {item.description}
                    </span>
                  </div>
                </div>

                <span className="text-sm text-right">
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
                </span>
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
