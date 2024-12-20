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
import { PaymentMethodIconMap } from "~/components/BrandIcons";

import {
  Form,
  FormControl,
  FormDescription,
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
import type { z } from "zod";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { payments } from "@/server/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { DollarSign, PencilLine, Undo2 } from "lucide-react";
import { useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatCurrency } from "~/lib/currencyFormat";
import { currencyValidator } from "~/lib/currencyValidator";
import { updatePaymentValidator } from "~/server/api/routers/payments/paymentValidators";

export function EditPayment({
  payment,
}: { payment: InferSelectModel<typeof payments> }) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [group] = useQueryState("group");
  const { data: groupMembers } = api.group.get.useQuery({
    groupId: group as string,
  });

  // Todo omit the recipient, as that can not be changed at the moment
  const formValidator = updatePaymentValidator.extend({
    amount: currencyValidator,
  });

  type FormType = z.infer<typeof formValidator>;

  const defaultValues = {
    ...payment,
    amount: `${(payment.amount / 100).toString()}` as unknown as number,
  };
  const { toast } = useToast();
  const form = useForm<FormType>({
    defaultValues,
    resolver: zodResolver(formValidator),
  });
  const { control, handleSubmit, formState } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.payments.edit.useMutation({
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
      utils.feed.get.invalidate({ groupId: group as string });
      utils.group.get.invalidate({ groupId: group as string });
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
      <Tooltip>
        <TooltipTrigger>
          <DialogTrigger asChild>
            <Button variant="ghost" size="smallIcon">
              <PencilLine />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Payment</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent
        onInteractOutside={(e) => {
          if (formState.isDirty) {
            e.preventDefault();
            toast({
              title: "Unsaved Changes. Click cancel to discard.",
            });
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Balances will be recalculated if the payment amount is changed
          </DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onValidationSuccess, onValidationError)}
              className="space-y-2"
            >
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

              {/* Recipient can not be edited, so this select box is purely information */}
              <FormItem>
                <FormLabel>Recipient</FormLabel>
                <Select value={payment.toUserId} disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select A Group Member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {groupMembers?.users.map((member) => (
                      <SelectItem
                        key={member.user.id}
                        value={member.user.id}
                        disabled={member.balance <= 0}
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
                          {member.balance >= 0 ? (
                            <span>
                              <span className="text-success">
                                is owed{" "}
                                {formatCurrency(Math.abs(member.balance))}
                              </span>{" "}
                            </span>
                          ) : (
                            <span className="text-destructive">
                              owes {formatCurrency(Math.abs(member.balance))}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Payment recipient can not be changed after payment is created
                </FormDescription>
                <FormMessage />
              </FormItem>

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
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select A Payment Method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...PaymentMethodIconMap.keys()].map((key) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-row items-center space-x-2">
                              <div className="flex h-6 w-6 items-center justify-center">
                                {PaymentMethodIconMap.get(key)}
                              </div>
                              <span>{key}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Record the payment method used to settle up
                    </FormDescription>
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
                        placeholder="Settling up for December"
                        {...field}
                      />
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
                  <Undo2 className="mr-2" />
                  Discard Changes
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
