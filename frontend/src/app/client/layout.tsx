import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { UserButton } from "@/components/user-button"; 
import { ClientAssistantChat } from "@/components/client-assistant-chat"; 

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Client Navbar */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center mx-auto">
            <div className="mr-4 hidden md:flex">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="hidden font-bold sm:inline-block">Hirefel</span>
                </Link>
                <nav className="flex items-center gap-4 text-sm lg:gap-6">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
                    <Link href="/projects" className="transition-colors hover:text-foreground/80 text-foreground/60">Projects</Link>
                    <Link href="/documents" className="transition-colors hover:text-foreground/80 text-foreground/60">Documents</Link>
                    <Link href="/team" className="transition-colors hover:text-foreground/80 text-foreground/60">Team</Link>
                </nav>
            </div>
            
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                    {/* Search or extra nav */}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/projects/new">New Project</Link>
                    </Button>
                    <ThemeSwitcher />
                    <UserButton /> 
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-screen-2xl py-6 mx-auto">
        {children}
      </main>
      
      {/* AI Assistant Widget */}
      <ClientAssistantChat />
    </div>
  );
}
