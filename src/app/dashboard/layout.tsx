import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import { AppSidebar } from "~/components/sidebar/app-sidebar";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
