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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, createShares } from "~/lib/utils";

import { Calendar } from "@/components/ui/calendar";
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
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  PencilLine,
  Undo2,
} from "lucide-react";

import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { currencyValidator } from "~/lib/currencyValidator";
import {
  editExpenseValidator,
  withSharesValidation,
} from "~/server/api/routers/expenses/expenseValidators";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { InferSelectModel } from "drizzle-orm";
import { CategoryIconMap } from "~/components/ExpenseCategoryIcons";
import { Checkbox } from "~/components/ui/checkbox";
import { dateValidator } from "~/lib/dateValidator";
import type { expenses } from "~/server/db/schema";
import { expenseCategories } from "~/server/db/schema";
import { api } from "~/trpc/react";

import clsx from "clsx";
import { Avatar, AvatarImage } from "~/components/ui/avatar";

const categories = expenseCategories.enumValues.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}));

export function EditExpense({
  expense,
}: { expense: InferSelectModel<typeof expenses> }) {
  const [group] = useQueryState("group");
  const [isOpen, setOpen] = useState<boolean>(false);

  const shareValidator = z
    .object({
      userId: z.string(),
      amount: currencyValidator.optional(),
      active: z.boolean(),
    })
    .array()
    .min(2);

  const formValidator = withSharesValidation(
    editExpenseValidator
      .extend({
        amount: currencyValidator,
        date: dateValidator,
        shares: shareValidator,
      })
      .transform((data) => {
        // If it is evenly split, manually calculate the shares, regardless of the user input
        if (data.splitType === "equal") {
          console.log(data);
          const shares = createShares(data.amount, data.shares.length);
          return {
            ...data,
            shares: data.shares.map((share, index) => ({
              ...share,
              amount: shares[index],
              active: true,
            })),
          };
        }
        // If not, strip out the inactive shares
        return {
          ...data,
          shares: data.shares.filter((share) => share.active),
        };
      }),
  );
  type FormType = z.infer<typeof formValidator>;

  const { data: groupMembers } = api.group.get.useQuery({
    groupId: group as string,
  });

  const defaultValues: FormType = {
    ...expense,
    date: new Date(expense.date * 1000),
    amount: `${(expense.amount / 100).toFixed(2)}` as unknown as number,
    shares:
      groupMembers?.users.map((member) => {
        const memberShare = expense?.shares?.find(
          (share) => share.userId === member.user.id,
        );
        return memberShare
          ? {
              ...memberShare,
              amount: String(memberShare.amount / 100),
              active: true,
            }
          : {
              amount: "0",
              userId: member.user.id,
              active: false,
            };
      }) ?? [],
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    resolver: zodResolver(formValidator),
    defaultValues,
  });

  const { control, handleSubmit, formState, watch } = form;

  const shares = useFieldArray({
    control,
    name: "shares",
  });

  const utils = api.useUtils();
  const { mutate, isPending } = api.expense.edit.useMutation({
    onSuccess: () => {
      toast({
        title: "Expense edited successfully",
      });
      form.reset(defaultValues);
      utils.feed.get.invalidate({ groupId: group as string });
      utils.group.get.invalidate({ groupId: group as string });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: error.data?.code ?? "Failed to edit expense",
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
      <Tooltip>
        <TooltipTrigger>
          <DialogTrigger asChild>
            <Button variant="ghost" size="smallIcon">
              <PencilLine />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit Expense</p>
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
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit, onValidationError)}
            className="space-y-2"
          >
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
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
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel optional={false}>Date </FormLabel>
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Category</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          // biome-ignore lint/a11y/useSemanticElements: <explanation>
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          <div className="flex flex-row items-center space-x-2">
                            {field.value && CategoryIconMap.get(field.value)}
                            <span>
                              {field.value
                                ? categories.find(
                                    (category) =>
                                      category.value === field.value,
                                  )?.label
                                : "Select Category"}
                            </span>
                          </div>
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className=" p-0 "
                      side="bottom"
                      style={{ width: "var(--radix-popover-trigger-width)" }}
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search for a category..."
                          className="h-9"
                        />
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty>No category found</CommandEmpty>
                          <CommandGroup>
                            {categories.map((category) => (
                              <CommandItem
                                value={category.label}
                                key={category.value}
                                onSelect={() => {
                                  form.setValue("category", category.value, {
                                    shouldTouch: true,
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                {CategoryIconMap.get(category.value)}
                                {category.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    category.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="splitType"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value === "equal"}
                      onCheckedChange={(e) => {
                        const set = e ? "equal" : "custom";
                        field.onChange(set);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="text-base">Split Evenly</FormLabel>
                </FormItem>
              )}
            />
            {watch("splitType") === "custom" && (
              <div className="space-y-2">
                {groupMembers?.users.map((member) => {
                  const memberIndex = shares.fields.findIndex(
                    (share) => share.userId === member.user.id,
                  );
                  return (
                    <div
                      key={member.user.id}
                      className="flex flex-row items-end justify-between"
                    >
                      <div className="flex flex-row items-center space-x-2">
                        <FormField
                          control={control}
                          name={`shares.${memberIndex}.active`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Avatar>
                          <AvatarImage
                            src={member.user.image ?? undefined}
                            alt={member.user.name}
                          />
                        </Avatar>
                        <span
                          className={clsx(
                            "text-nowrap",
                            watch(`shares.${memberIndex}.active`)
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {/* The user */}
                          {member.user.name}
                        </span>
                      </div>

                      <FormField
                        control={control}
                        disabled={!watch(`shares.${memberIndex}.active`)}
                        name={`shares.${memberIndex}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <div className="relative ">
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
                    </div>
                  );
                })}
                <span className="py-2 font-bold text-destructive">
                  {formState.errors[""]?.message}
                </span>
              </div>
            )}

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

                <Button type="submit" disabled={isPending} loading={isPending}>
                  Submit
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
