"use client";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useQueryState } from "nuqs";
import { api } from "~/trpc/react";
import { CreateGroup } from "./CreateGroup";
import { JoinGroup } from "./JoinGroup";

export const SidebarGroups = () => {
  const { data: groups } = api.group.list.useQuery();
  const utils = api.useUtils();
  const [group, setGroup] = useQueryState("group");
  if (groups && groups.length > 0 && group === null) {
    //@ts-ignore - we know it's not null
    setGroup(groups[0].group.id);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Groups</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {groups?.map((item) => (
            <SidebarMenuItem key={item.group.id}>
              <SidebarMenuButton
                isActive={item.group.id === group}
                onClick={() => setGroup(item.group.id)}
                onMouseEnter={() =>
                  utils.group.get.prefetch({ groupId: item.group.id })
                }
              >
                {item.group.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <CreateGroup />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <JoinGroup />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
