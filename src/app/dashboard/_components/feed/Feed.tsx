"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  HandCoins,
} from "lucide-react";
import { PaymentMethodIconMap } from "~/components/BrandIcons";
import { CategoryIconMapSize } from "~/components/ExpenseCategoryIcons";
import { formatCurrency } from "~/lib/currencyFormat";
import { formatDate } from "~/lib/utils";
import type { RouterOutputs } from "~/server/api/root";
import type { GroupMemberMap } from "~/server/api/routers/groups/groupRouter";
import { FeedItem } from "./FeedItem";

type Feed = RouterOutputs["feed"]["get"];
interface FeedProps {
  filteredResult: Feed;
  groupMembers: GroupMemberMap;
}

function RenderIcon({ item }: { item: Feed[number] }) {
  if ("userId" in item) {
    return (
      CategoryIconMapSize.get(item.category as string)?.({ size: 40 }) ?? (
        <CircleDollarSign size={40} />
      )
    );
  }
  if (item.paymentMethod) {
    // Work around since the svgs are not well sized
    if (item.paymentMethod === "Cash") {
      return <Banknote size={40} />;
    }
    if (item.paymentMethod === "Other") {
      return <CreditCard size={40} />;
    }
    return (
      <div className="-ml-1 w-11">
        {PaymentMethodIconMap.get(item.paymentMethod)}
      </div>
    );
  }

  return <HandCoins size={40} />;
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
                  <div className="w-11">
                    <RenderIcon item={item} />
                  </div>
                  <div className="flex flex-col items-start space-y-2">
                    <div className="text-gray-500 text-sm">
                      {formatDate(item.createdAt)}
                    </div>
                    <span className="text-left font-semibold text-lg">
                      {item.description}
                    </span>
                  </div>
                </div>

                <span className="text-right text-sm">
                  {"userId" in item ? ( // Expense
                    <>
                      {groupMembers.get(item.userId)?.name} paid{" "}
                      {formatCurrency(item.amount)}
                    </>
                  ) : "toUserId" in item ? ( // Payment
                    <>
                      {groupMembers.get(item.fromUserId)?.name} paid{" "}
                      {formatCurrency(item.amount)} to{" "}
                      {groupMembers.get(item.toUserId)?.name}
                    </>
                  ) : null}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FeedItem feedItem={item} groupMembers={groupMembers} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
