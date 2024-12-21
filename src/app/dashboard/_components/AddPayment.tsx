"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useBeforeunload } from "react-beforeunload";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { z } from "zod";

import { CalendarIcon, DollarSign, HandCoins } from "lucide-react";
import { useQueryState } from "nuqs";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { formatCurrency } from "~/lib/currencyFormat";
import { currencyValidator } from "~/lib/currencyValidator";
import { dateValidator } from "~/lib/dateValidator";
import { getFormattedDate } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { createPaymentValidator } from "~/server/api/routers/payments/paymentValidators";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export function AddPayment() {
  const [group] = useQueryState("group");
  const [isOpen, setOpen] = useState<boolean>(false);
  const [closeOnSubmit, setCloseOnSubmit] = useState<boolean>(true);

  const { data: user } = api.me.useQuery();
  const { data: groupMembers } = api.group.get.useQuery({
    groupId: group as string,
  });

  const formValidator = createPaymentValidator.extend({
    amount: currencyValidator,
    date: dateValidator,
    toUserId: z.string().min(1, {
      message: "Payment Recipient is required",
    }),
    paymentMethod: z.string().transform((val) => (val === "" ? null : val)),
  });

  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    description: `${getFormattedDate()} Payment`,
    amount: 0,
    groupId: group as string,
    toUserId: "",
    notes: "",
    // @ts-ignore The paymentMethod is optional
    paymentMethod: "",
    // @ts-ignore The date object is transformed upon validation
    date: new Date(),
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
        title: "Payment Created Successfully",
        description: `Your payed ${groupMembers?.userMap.get(data.toUserId)?.name} ${formatCurrency(data.amount)} ${data.paymentMethod ? `with ${data.paymentMethod}` : ""}`,
      });
      form.reset(defaultValues);
      utils.feed.get.invalidate({ groupId: group as string });
      utils.group.get.invalidate({ groupId: group as string });
      setOpen(!closeOnSubmit);
    },
    onError: (error) => {
      toast({
        title: error.data?.code ?? "Failed to create payment",
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
              title: "Unsaved Changes. Click cancel to discard.",
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

              <FormField
                control={form.control}
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={false}>Recipient</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (!formState.dirtyFields.amount) {
                          const owed =
                            (groupMembers?.users.find(
                              (member) => member.user.id === value,
                            )?.balance ?? defaultValues.amount) / 100;
                          form.setValue(
                            "amount",
                            // @ts-ignore - value is later coerced to a number, but input "expects" a string
                            owed > 0
                              ? owed.toFixed(2)
                              : defaultValues.amount.toFixed(2),
                          );
                        }
                        field.onChange(value);
                      }}
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
                                    owes{" "}
                                    {formatCurrency(Math.abs(member.balance))}
                                  </span>
                                )}
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
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel optional={false}>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Expense date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="center"
                        side="bottom"
                      >
                        <Calendar
                          mode="single"
                          // @ts-ignore The zod coercion into a number only happens on validation, so field.value is a Date object
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
              <DialogFooter className="mt-4 flex flex-row items-center justify-end space-x-2">
                <div className="mr-auto space-x-2">
                  <Button
                    type="button"
                    onClick={() => form.reset(defaultValues)}
                    variant="destructive"
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      form.reset(defaultValues);
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  loading={isPending && closeOnSubmit}
                  onClick={() => setCloseOnSubmit(true)}
                >
                  Create
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  loading={isPending && !closeOnSubmit}
                  onClick={() => setCloseOnSubmit(false)}
                >
                  Create Another
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
