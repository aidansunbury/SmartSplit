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
import { Check, ChevronsUpDown, CircleDollarSign } from "lucide-react";
import type { z } from "zod";

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

import {
  CategoryIconMap,
  CategoryKeywordMap,
} from "~/components/ExpenseCategoryIcons";
import { cn } from "~/lib/utils";
import { expenseCategories } from "~/server/db/schema";
import { api } from "~/trpc/react";

const categories = expenseCategories.enumValues.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}));

export function AddExpense() {
  const [group] = useQueryState("group");
  const [isOpen, setOpen] = useState<boolean>(false);

  const formValidator = createExpenseValidator.extend({
    amount: currencyValidator,
  });
  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    groupId: group as string,
    amount: 0,
    description: "",
    notes: "",
    category: null,
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
      utils.feed.get.invalidate({ groupId: group as string });
      utils.group.get.invalidate({ groupId: group as string });
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
        <Button variant={"default"}>
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
