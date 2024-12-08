"use client";

import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "~/components/sidebar/nav-user";
import { SidebarGroups } from "./nav-groups";

export type UserAvatar = {
  name: string;
  email: string;
  image?: string;
};

// TODO include join group and create group in sidebar
export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserAvatar }) {
  return (
    <Sidebar variant="inset" {...props}>
      {/* <SidebarHeader><TeamSwitcher teams={data.teams} /></SidebarHeader> */}
      <SidebarContent>
        <SidebarGroups />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
