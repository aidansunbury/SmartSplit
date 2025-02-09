"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "~/components/ui/copy-button";
import { env } from "~/env";
import { api } from "~/trpc/react";

import { RefreshCcw } from "lucide-react";
import { useQueryState } from "nuqs";
import { Button } from "~/components/ui/button";

export function SettingsDialog() {
  const [settings, setSettings] = useQueryState("settings");
  const [groupId] = useQueryState("group");

  const [group] = api.group.get.useSuspenseQuery({
    groupId: groupId ?? "",
  });
  const utils = api.useUtils();

  const { mutate, isPending } = api.group.refreshJoinCode.useMutation({
    onSuccess: () => {
      utils.group.get.invalidate({
        groupId: groupId ?? "",
      });
    },
  });
  const onTabChange = (value: string) => {
    setSettings(value);
  };
  return (
    <Dialog
      open={settings !== null}
      onOpenChange={(isOpen) => (isOpen ? null : setSettings(null))}
    >
      <DialogContent>
        <Tabs
          defaultValue="invite"
          value={settings ?? undefined}
          onValueChange={onTabChange}
        >
          <TabsList className="mt-3">
            <TabsTrigger value="invite">Invite</TabsTrigger>

            <TabsTrigger value="general">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="invite" className="flex flex-col">
            <h1 className="mb-2 font-bold text-2xl">Invite Group Members</h1>
            <p className="mb-4 text-gray-500 text-sm">
              Invite members to your group by sharing the join code below, or
              use the full invite link
            </p>
            <div className="space-y-2 pb-2">
              <Label htmlFor="code">Join Code</Label>
              <div className="flex rounded-lg shadow-black/5 shadow-sm">
                <Input
                  id="code"
                  className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                  value={group.joinCode}
                />
                <CopyButton
                  disabled={isPending}
                  className="inline-flex items-center rounded-none rounded-e-lg border border-input bg-background px-3 font-medium text-foreground text-sm outline-offset-2 transition-colors hover:bg-accent hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:cursor-not-allowed disabled:opacity-50"
                  text={group.joinCode}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Join Link</Label>
              <div className="flex rounded-lg shadow-black/5 shadow-sm">
                <Input
                  id="link"
                  className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                  value={`${env.NEXT_PUBLIC_URL}/join/${group.joinCode}`}
                  type="email"
                />
                <CopyButton
                  disabled={isPending}
                  className="inline-flex items-center rounded-none rounded-e-lg border border-input bg-background px-3 font-medium text-foreground text-sm outline-offset-2 transition-colors hover:bg-accent hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:cursor-not-allowed disabled:opacity-50"
                  text={`${env.NEXT_PUBLIC_URL}/join/${group.joinCode}`}
                />
              </div>
              <Button
                type="button"
                variant={"destructive"}
                disabled={isPending}
                onClick={() => mutate({ groupId: group.id })}
              >
                <RefreshCcw className="mr-2" />
                Refresh Join Code
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="general">
            <h1 className="mb-2 font-bold text-2xl">Group Settings</h1>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
