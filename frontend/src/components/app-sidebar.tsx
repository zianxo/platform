"use client";

import { 
  Briefcase, 
  DollarSign, 
  FileText,
  Settings, 
  Users,
  LayoutDashboard,
  Building2,
  Files,
  ChevronsUpDown,
  Plus,
  LogOut,
  User as UserIcon,
  Sparkles,
  BrainCircuit
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { useClientContext } from "@/components/providers/client-provider";

// Grouped Navigation
const navGroups = [
  {
    label: "Platform",
    items: [
       { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    label: "Recruitment",
    items: [
      { title: "Talent", url: "/talent", icon: Users },
      { title: "Clients", url: "/clients", icon: Building2 },
      { title: "Projects", url: "/projects", icon: Briefcase },
    ]
  },
  {
      label: "Operations",
      items: [
        { title: "Contracts", url: "/contracts", icon: FileText },
        { title: "Invoices", url: "/invoices", icon: FileText },
        { title: "Payments", url: "/payments", icon: DollarSign },
        { title: "Documents", url: "/documents", icon: Files },
        { title: "Finance", url: "/finance", icon: DollarSign },
      ]
  },
  {
      label: "System",
      items: [
       { title: "Skills", url: "/skills", icon: BrainCircuit },
       { title: "Settings", url: "/settings", icon: Settings },
      ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { activeClient, setActiveClient } = useClientContext();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });

  useEffect(() => {
    // If we have clients, but no active client, maybe set first? 
    // Or allow "No Context"?
    // User requested switching context. 
    // Let's keep it null by default (All Clients) unless explicitly set?
    // But previous code auto-selected first.
    // If user implies "Is it filtered?", implies default might be "All".
    // Let's allow clearing context.
    if (!activeClient && clients && clients.length > 0) {
          // Optional: Auto-select first. 
          // setActiveClient(clients[0]);
    }
  }, [clients]);


  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-transparent">
      <div className="absolute inset-0 z-[-1] glass pointer-events-none" />
      <SidebarHeader className="border-b border-white/5 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-300 hover:bg-white/5"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-bold uppercase tracking-wider text-[10px] text-muted-foreground/60">
                        Context
                    </span>
                    <span className="truncate font-semibold tracking-tight text-foreground/90">
                        {activeClient ? activeClient.company_name : "All Clients"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch Context
                </DropdownMenuLabel>
                <DropdownMenuItem 
                    onClick={() => setActiveClient(null)} 
                    className="gap-2 p-2"
                >
                   <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Briefcase className="size-4 shrink-0" />
                   </div>
                   All Clients
                </DropdownMenuItem>
                {clients?.map((client, idx) => (
                    <DropdownMenuItem 
                        key={client.id} 
                        onClick={() => setActiveClient(client)} 
                        className="gap-2 p-2"
                    >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Building2 className="size-4 shrink-0" />
                    </div>
                    {client.company_name}
                    <DropdownMenuShortcut>⌘{idx + 1}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2" asChild>
                  <Link href="/clients/new">
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">Add Client</div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {group.items.map((item) => {
                             // Check for active state: exact match or starts with url/
                             const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`);
                             return (
                             <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton 
                                    asChild 
                                    tooltip={item.title} 
                                    isActive={isActive}
                                    className="hover:translate-x-1 transition-transform duration-200"
                                >
                                    <Link href={item.url} className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'bg-transparent text-muted-foreground group-hover:bg-white/5'}`}>
                                            <item.icon className="size-4" />
                                        </div>
                                        <span className={isActive ? "font-semibold" : "font-medium"}>{item.title}</span>
                                        {isActive}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )})}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-4">
         <SidebarMenu>
            <SidebarMenuItem>
                <div className="flex flex-col gap-4">
                    {user && (
                        <div className="glass-card p-3 rounded-xl flex items-center gap-3">
                            <div className="size-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
                                {user?.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate leading-none mb-1">{user.email.split('@')[0]}</p>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-bold bg-white/10 text-white/70 hover:bg-white/20 border-0">
                                    {user.role}
                                </Badge>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive group"
                                onClick={logout}
                            >
                                <LogOut className="size-4 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                        </div>
                    )}
                    <div className="px-1">
                        <ThemeSwitcher />
                    </div>
                </div>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
