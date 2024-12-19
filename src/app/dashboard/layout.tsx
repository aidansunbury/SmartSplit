import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import { AppSidebar } from "~/components/sidebar/app-sidebar";
import { ModeToggle } from "~/components/theme-toggle";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerAuthSession();
  if (!session) {
    return redirect("/");
  }
  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
