"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useQueryState } from "nuqs";

export function SettingsDialog() {
  const [settings, setSettings] = useQueryState("settings");

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
          <TabsContent value="invite">
            <h1 className="mb-2 font-bold text-2xl">Invite Group Members</h1>
            Make changes to your account here.
          </TabsContent>
          <TabsContent value="general">Change your password here.</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
