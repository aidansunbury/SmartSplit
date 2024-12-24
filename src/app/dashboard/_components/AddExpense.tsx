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
import { format } from "date-fns";

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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  CircleDollarSign,
} from "lucide-react";
import type { z } from "zod";
import { dateValidator } from "~/lib/dateValidator";

import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { currencyValidator } from "~/lib/currencyValidator";
import { createExpenseValidator } from "~/server/api/routers/expenses/expenseValidators";

import { Calendar } from "@/components/ui/calendar";
import {
  CategoryIconMap,
  CategoryKeywordMap,
} from "~/components/ExpenseCategoryIcons";
import { formatCurrency } from "~/lib/currencyFormat";
import { cn } from "~/lib/utils";
import { expenseCategories } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { Checkbox } from "~/components/ui/checkbox";
import type { ExpenseShare } from "~/server/db/schema";

const categories = expenseCategories.enumValues.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}));

const splitTypes = ["equal", "exact amounts"] as const;
type SplitType = (typeof splitTypes)[number];

export function AddExpense() {
  const [group] = useQueryState("group");
  const [isOpen, setOpen] = useState<boolean>(false);
  const [closeOnSubmit, setCloseOnSubmit] = useState<boolean>(true);

  const { data: groupMembers } = api.group.get.useQuery({
    groupId: group as string,
  });

  const formValidator = createExpenseValidator.extend({
    amount: currencyValidator,
    date: dateValidator,
  });
  type FormType = Omit<z.infer<typeof formValidator>, "shares"> & {
    splitTypes: SplitType;
  } & { shares: Array<ExpenseShare & { active: boolean }> };

  const defaultValues: FormType = {
    groupId: group as string,
    amount: "0" as unknown as number,
    description: "",
    notes: "",
    category: null,
    splitTypes: "equal",
    // @ts-ignore The date object is transformed upon validation
    date: new Date(),
    shares: [],
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    resolver: zodResolver(formValidator),
    defaultValues,
  });

  const { control, handleSubmit, formState, watch } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.expense.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Expense Created Successfully",
        description: `Your spent ${formatCurrency(data.amount)} on ${data.description}`,
      });
      form.reset(defaultValues);
      utils.feed.get.invalidate({ groupId: group as string });
      utils.group.get.invalidate({ groupId: group as string });
      setOpen(!closeOnSubmit);
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

  const [date, setDate] = useState<Date>();

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
          <CircleDollarSign size={24} />
          Add Expense
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
              render={({ field }) => {
                const { onChange, ...props } = field;
                return (
                  <FormItem>
                    <FormLabel optional={false}>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Grocery Run"
                        onChange={(e) => {
                          onChange(e);
                          if (formState.dirtyFields.category) {
                            return;
                          }
                          const value = e.target.value.toLowerCase();
                          const category = CategoryKeywordMap.get(value);
                          if (category) {
                            form.setValue("category", category);
                          }
                        }}
                        {...props}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                    <PopoverTrigger
                      asChild
                      onClick={() => console.log("popover clicked")}
                    >
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
              name="splitTypes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value === "equal"}
                      onCheckedChange={(e) => {
                        const set = e ? "equal" : "exact amounts";
                        field.onChange(set);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Split Evenly</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {watch("splitTypes") === "exact amounts" && "Hi"}

            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Textarea placeholder="More info..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4 flex flex-row items-center justify-end space-x-2">
              <div className="mr-auto flex flex-row space-x-2">
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
                  className="hidden md:flex"
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
      </DialogContent>
    </Dialog>
  );
}
