"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useBeforeunload } from "react-beforeunload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { api } from "@/trpc/react";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { safeInsertSchema } from "@/lib/safeInsertSchema";
import { payments } from "@/server/db/schema";
import { DollarSign, HandCoins } from "lucide-react";
import { useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { currencyValidator } from "~/lib/currencyValidator";
import { getFormattedDate } from "~/lib/utils";

export function AddPayment() {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [group] = useQueryState("group");
  const { data: user } = api.me.useQuery();
  const { data: groupMembers } = api.group.get.useQuery({
    groupId: group as string,
  });

  const formValidator = safeInsertSchema(payments).extend({
    description: z.string().min(1),
    amount: currencyValidator,
  });

  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    description: `${getFormattedDate()} Payment`,
    amount: 0,
    groupId: group as string,
    fromUserId: user?.id ?? "",
    toUserId: "",
    notes: "",
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    defaultValues,
    resolver: zodResolver(formValidator),
  });
  const { control, handleSubmit, formState } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.payments.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Form Submitted",
        description: (
          <div className="w-80">
            <h1>Returned:</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ),
      });
      form.reset(defaultValues);
      setOpen(false);
      utils.feed.getGroupFeed.invalidate(); // TOD0: Replace me with your invalidation
    },
    onError: (error) => {
      toast({
        title: error.data?.code ?? "Error",
        description: error.message,
      });
    },
  });
  useBeforeunload(formState.isDirty ? () => "Unsaved changes" : undefined);

  const onValidationSuccess: SubmitHandler<FormType> = async (data) => {
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
        <Button variant={"default"}>
          <HandCoins size={24} />
          Add Payment
        </Button>
      </DialogTrigger>

      <DialogContent
        onInteractOutside={(e) => {
          if (formState.isDirty) {
            e.preventDefault();
            toast({
              title: "Unsaved Changes",
            });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payments between group members.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onValidationSuccess, onValidationError)}
              className="space-y-2"
            >
              {/* Input */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={false}>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="July Settle Up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* // TODO: When a user is selected, it should auto fill the amount that they are owed */}
              <FormField
                control={form.control}
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={false}>Recipient</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!groupMembers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select A Group Member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groupMembers?.users
                          .filter((member) => member.user.id !== user?.id)
                          .map((member) => (
                            <SelectItem
                              key={member.user.id}
                              value={member.user.id}
                            >
                              <div className="flex flex-row items-center space-x-2">
                                <Avatar className="h-6 w-6 rounded-lg">
                                  <AvatarImage
                                    src={member.user.image ?? ""}
                                    alt={member.user.name}
                                  />
                                  <AvatarFallback className="rounded-lg">
                                    {":)"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.user.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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

              {/* Optional Input */}
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Textarea placeholder="Paid using Venmo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4 flex flex-row justify-between">
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

                  <Button
                    type="submit"
                    disabled={isPending}
                    loading={isPending}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
