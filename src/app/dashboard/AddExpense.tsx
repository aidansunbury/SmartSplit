"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useBeforeunload } from "react-beforeunload";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CircleDollarSign } from "lucide-react";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { currencyValidator } from "~/lib/currencyValidator";
import { safeInsertSchema } from "~/lib/safeInsertSchema";
import { expenses } from "~/server/db/schema";
import { api } from "~/trpc/react";

export function AddExpense() {
  const [group] = useQueryState("group");
  const [isOpen, setOpen] = useState<boolean>(false);

  const formValidator = safeInsertSchema(expenses).extend({
    description: z.string().min(1),
    amount: currencyValidator,
  });
  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    groupId: group as string,
    amount: 0,
    description: "",
    notes: "",
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    resolver: zodResolver(formValidator),
    defaultValues,
  });

  const { control, handleSubmit, formState } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.expense.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Expense created successfully",
        description: "Your expense has been added to the group",
      });
      form.reset(defaultValues);
      utils.feed.getGroupFeed.invalidate({ groupId: group as string });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: error.data?.code ?? "Failed to create expense",
        description: error.message,
      });
    },
  });
  useBeforeunload(formState.isDirty ? () => "Unsaved changes" : undefined);

  const onSubmit: SubmitHandler<FormType> = async (data) => {
    console.log(data);
    mutate(data);
  };

  const onValidationError: SubmitErrorHandler<FormType> = (errors) => {
    console.log(errors);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        form.reset(defaultValues);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={"ghost"}>
          <CircleDollarSign size={24} />
          Add Expense
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if (formState.isDirty) {
            e.preventDefault();
            toast({
              title: "Unsaved Changes",
            });
          }
        }}
      >
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, onValidationError)}
            className="space-y-2"
          >
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Add an expense to be shared with your group.
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional={false}>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Grocery Run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel optional={false}>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="input-09"
                        className="peer ps-9"
                        placeholder="10.00"
                        type="number"
                        {...field}
                      />
                      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                        <DollarSign
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Textarea
                      placeholder="Add more detailed info about the expense..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4 flex flex-row justify-between sm:justify-between">
              <Button
                type="button"
                onClick={() => form.reset(defaultValues)}
                variant={"destructive"}
              >
                Reset
              </Button>
              <div className="space-x-2">
                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    form.reset(defaultValues);
                  }}
                  variant={"ghost"}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isPending} loading={isPending}>
                  Create Expense
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
