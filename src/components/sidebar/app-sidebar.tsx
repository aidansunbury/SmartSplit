"use client";

import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Handshake } from "lucide-react";
import Link from "next/link";
import { NavUser } from "~/components/sidebar/nav-user";
import { SidebarGroups } from "./nav-groups";

export type UserAvatar = {
  name: string;
  email: string;
  image?: string;
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserAvatar }) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <Link href={"/"} className="flex flex-row">
          {" "}
          <Handshake size={28} className="mr-1" />
          <h1 className="items-center font-bold text-2xl">Smart Split</h1>
        </Link>
      </SidebarHeader>
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
