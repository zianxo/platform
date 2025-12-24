import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientProvider } from "@/components/providers/client-provider";
import { SecondarySidebar, SecondarySidebarSkeleton } from "@/components/secondary-sidebar";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
        <SidebarProvider>
        <div className="flex min-h-screen w-full">
            <AppSidebar />
            <Suspense fallback={<SecondarySidebarSkeleton />}>
              <SecondarySidebar />
            </Suspense>
            <main className="flex-1 overflow-y-auto bg-background p-8">
                {children}
            </main>
        </div>
        </SidebarProvider>
    </ClientProvider>
  );
}
