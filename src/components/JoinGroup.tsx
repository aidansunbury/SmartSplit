"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { api } from "@/trpc/react";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { UsersRound } from "lucide-react";
import { useQueryState } from "nuqs";
import { z } from "zod";

export function JoinGroup() {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [_, setGroup] = useQueryState("group");

  const formValidator = z.object({ joinCode: z.string() });

  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    joinCode: "",
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    defaultValues,
    resolver: zodResolver(formValidator),
  });
  const { control, handleSubmit, formState } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.group.join.useMutation({
    onSuccess: (data) => {
      toast({
        title: `Joined Group: ${data.name}`,
        description: data.description,
      });
      form.reset(defaultValues);
      utils.group.list.invalidate();
      setOpen(false);
      setGroup(data.id);
    },
    onError: (error) => {
      toast({
        title: error.data?.code ?? "Error",
        description: error.message,
      });
    },
  });

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
        <SidebarMenuButton>
          <UsersRound size={24} />
          Join Group
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
        </DialogHeader>
        <div className="w-full">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onValidationSuccess, onValidationError)}
              className="space-y-2"
            >
              <FormField
                control={control}
                name="joinCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={false}>Join Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ac69bb13-f0b9-4dd3-b2f5-a4e954b1d13c"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The join code should be a UUID
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4 flex flex-row justify-end space-x-2">
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
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
