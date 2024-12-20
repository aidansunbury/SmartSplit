"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

import { useToast } from "~/hooks/use-toast";

export const DeleteFeedItemDialog = ({
  itemType,
  itemId,
  itemDescription,
}: {
  itemType: "expense" | "payment";
  itemId: string;
  itemDescription: string;
}) => {
  const { toast } = useToast();
  const utils = api.useUtils();
  const onSuccess = () => {
    utils.feed.invalidate();
    utils.group.get.invalidate();
    toast({
      title: `${itemDescription} ${itemType} deleted successfully`,
    });
  };
  const { mutate: deleteExpense } = api.expense.delete.useMutation({
    onSuccess,
  });
  const { mutate: deletePayment } = api.payments.delete.useMutation({
    onSuccess,
  });

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="smallIcon">
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Delete {itemType}</p>
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete{" "}
            <span className="italic">{itemDescription}?</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action can not be undone. Group balances will be recalculated
            as if {itemType} was never created.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (itemType === "expense") {
                deleteExpense({ id: itemId });
              } else {
                deletePayment({ id: itemId });
              }
            }}
            variant={"destructive"}
          >
            <Trash2 className="mr-2" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
