"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "~/trpc/react";
import { useQueryState } from "nuqs";

export function Feed() {
  const [group, setGroup] = useQueryState("group");
  const { data: feed, isLoading } = api.feed.getGroupFeed.useQuery(
    { groupId: group as string },
    {
      enabled: group !== null,
    },
  );
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!feed) {
    return <div>No feed</div>;
  }

  return (
    <Accordion type="multiple">
      {feed.map((item) => (
        <AccordionItem value={item.id} key={item.id}>
          <AccordionTrigger>{item.amount}</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
