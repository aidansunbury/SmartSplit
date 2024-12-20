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
          className="w-[400px]"
          value={settings}
          onValueChange={onTabChange}
        >
          <TabsList>
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="general">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="invite">
            Make changes to your account here.
          </TabsContent>
          <TabsContent value="general">Change your password here.</TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
