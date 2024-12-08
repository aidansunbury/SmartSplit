"use client";

import {
  Dialog,
  DialogContent,
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
import { safeInsertSchema } from "@/lib/safeInsertSchema";
import { groups } from "@/server/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus } from "lucide-react";
import { useQueryState } from "nuqs";
import { z } from "zod";

export function CreateGroup() {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [_, setGroup] = useQueryState("group");
  const { data: user } = api.me.useQuery();

  const formValidator = safeInsertSchema(groups)
    .omit({
      joinCode: true,
      settledSince: true,
    })
    .extend({
      name: z.string().min(1),
    });

  type FormType = z.infer<typeof formValidator>;

  const defaultValues: FormType = {
    name: "",
    description: null,
    ownerId: user?.id ?? "",
  };

  const { toast } = useToast();
  const form = useForm<FormType>({
    defaultValues,
    resolver: zodResolver(formValidator),
  });
  const { control, handleSubmit, formState } = form;
  const utils = api.useUtils();
  const { mutate, isPending } = api.group.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: `Created Group: ${data.name}`,
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
        <SidebarMenuButton>
          <CirclePlus size={24} />
          Create New Group
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={false}>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Basic text input" {...field} />
                    </FormControl>
                    <FormDescription>You can change this later</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional Input */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Input placeholder="Basic text input" {...field} />
                    </FormControl>
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
