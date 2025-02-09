"use client";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useQueryState } from "nuqs";
import { api } from "~/trpc/react";
import { CreateGroup } from "./CreateGroup";
import { JoinGroup } from "./JoinGroup";
import type { UserAvatar } from "./app-sidebar";
export const SidebarGroups = ({ user }: { user: UserAvatar }) => {
  const { data: groups } = api.group.list.useQuery();
  const utils = api.useUtils();
  const [group, setGroup] = useQueryState("group");
  const [lastGroup, setLastGroup] = useLocalStorage<string | null>(
    `lastGroup-${user.id}`,
    null,
  );
  if (lastGroup && group === null) {
    setGroup(lastGroup);
  }
  if (groups && groups.length > 0 && group === null) {
    //@ts-ignore - we know it's not null
    setGroup(groups[0].group.id);
    setLastGroup(groups[0]?.group.id ?? null);
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
                onClick={() => {
                  setGroup(item.group.id);
                  setLastGroup(item.group.id);
                }}
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
