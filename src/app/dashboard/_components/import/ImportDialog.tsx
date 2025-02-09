"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { MoveRight, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useBeforeunload } from "react-beforeunload";
import { useDropzone } from "react-dropzone";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Spinner } from "~/components/ui/spinner";
import {
  type Person,
  type Transaction,
  parseFinancialCSV,
  readCSVFile,
} from "./parseSplitwiseCSV";

const newMemberId = "new_member";

const groupMemberMapSchema = z
  .object({
    mappings: z
      .object({
        memberId: z.string(),
        tempId: z.string(),
        name: z.string(),
      })
      .array(),
  })
  .refine(
    (value) => {
      // No duplicate member Ids except for new_member
      const memberIds = value.mappings
        .map((v) => v.memberId)
        .filter((v) => v !== newMemberId);
      return new Set(memberIds).size === memberIds.length;
    },
    {
      message: "No member can be selected more than once",
      path: ["mappings"],
    },
  );

function CardWrapper({
  children,
  footer,
  title,
  description,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Import From Splitwise - {title}</DialogTitle>
      </DialogHeader>
      <p className="text-accent-foreground text-sm">{description}</p>
      {children}
      <DialogFooter className="flex flex-col justify-between">
        {footer}
      </DialogFooter>
    </>
  );
}

export function ImportDialog({ groupId }: { groupId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{
    transactions: Transaction[];
    people: Person[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useBeforeunload(parsed !== null ? () => "Your import is unsaved" : undefined);
  const { toast } = useToast();
  const [groupMembers] = api.group.get.useSuspenseQuery({
    groupId,
  });
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof groupMemberMapSchema>>({
    resolver: zodResolver(groupMemberMapSchema),
    defaultValues: {
      mappings: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "mappings",
  });
  const onSubmit = (data: z.infer<typeof groupMemberMapSchema>) => {
    console.log(data);
  };
  const onError = (error: any) => {
    console.error(error);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      // Read and parse the CSV file
      const processed = parseFinancialCSV(
        await readCSVFile(acceptedFiles[0] as File),
      );
      setParsed(processed);
      append(
        processed.people.map((person) => ({
          name: person.name,
          tempId: person.id,
          memberId: newMemberId, // Default to new_member
        })),
      );
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
      });
    }
    setLoading(false);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import</Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if (parsed) {
            e.preventDefault();
            toast({
              title: "Unsaved Changes. Click cancel to discard.",
            });
          } else {
            setFile(null);
            setParsed(null);
            remove();
          }
        }}
      >
        {!parsed ? (
          <CardWrapper
            title="Upload CSV"
            description="In Splitwise, Select settings, export as spreadsheet. Then upload the CSV file here."
            footer={null}
          >
            <div className="mx-auto w-full max-w-md">
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary"
                }`}
              >
                <input {...getInputProps()} />
                {loading ? (
                  <Spinner className="size-12" />
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}

                <p className="mt-2 text-gray-600 text-sm">
                  {isDragActive
                    ? "Drop the CSV file here"
                    : "Drag 'n' drop a CSV file here, or click to select one"}
                </p>
              </div>
              {file && (
                <div className="mt-4 text-gray-600 text-sm">
                  Selected file: {file.name}
                </div>
              )}
            </div>
          </CardWrapper>
        ) : (
          <CardWrapper
            title="Match Users"
            description="Match group members to Splitwise names. If a Splitwise user has not yet joined your group, select 'New Member' and they will be able to claim their balance when they join."
            footer={
              <Button
                type="submit"
                className="self-center"
                onClick={form.handleSubmit(onSubmit, onError)}
              >
                Import{" "}
                {parsed.transactions.filter((t) => t.type === "expense").length}{" "}
                expenses and{" "}
                {parsed.transactions.filter((t) => t.type === "payment").length}{" "}
                payments
              </Button>
            }
          >
            <Form {...form}>
              <form
                className="space-y-2"
                onSubmit={form.handleSubmit(onSubmit, onError)}
              >
                {fields.map((person, index) => (
                  <div
                    key={person.id}
                    className="flex flex-row items-center justify-between space-x-2"
                  >
                    <span>{person.name}</span>
                    <MoveRight className="h-6 w-6" />
                    <FormField
                      control={form.control}
                      name={`mappings.${index}.memberId`}
                      render={({ field }) => (
                        <FormItem className="w-48 self-end">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={newMemberId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select A Group Member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                ...groupMembers?.users,
                                {
                                  user: { id: newMemberId, name: "New Member" },
                                },
                              ].map((member) => (
                                <SelectItem
                                  key={member.user.id}
                                  value={member.user.id}
                                >
                                  <div className="flex flex-row items-center space-x-2">
                                    {member.user.image ? (
                                      <Avatar className="h-6 w-6 rounded-lg">
                                        <AvatarImage
                                          src={
                                            member.user
                                              .image as unknown as string
                                          }
                                          alt={member.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                          {":)"}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <UserRound className="h-6 w-6" />
                                    )}

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
                  </div>
                ))}
                <span className="text-destructive">
                  {form.formState.errors.mappings?.root?.message}
                </span>
              </form>
            </Form>
          </CardWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
