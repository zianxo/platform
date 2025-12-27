"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Briefcase,
  Building2,
  FileText,
  Users,
  Files,
  ArrowRight,
  TrendingUp,
  CreditCard,
  DollarSign
} from "lucide-react";

// Configuration for Secondary Sidebar
const sidebarConfig: Record<string, { title: string; icon: any; items: { label: string; href: string }[] }> = {
  projects: {
    title: "Projects",
    icon: Briefcase,
    items: [
      { label: "Overview", href: "/projects" },
      { label: "Active", href: "/projects/all?status=active" },
      { label: "Planned", href: "/projects/all?status=planned" },
      { label: "Archived", href: "/projects/all?status=archived" },
      { label: "Resources", href: "/projects/resources" },
      { label: "Assignments", href: "/projects/assignments" },
      { label: "Documents", href: "/projects/documents" },
    ],
  },
  invoices: {
    title: "Invoices",
    icon: CreditCard,
    items: [
      { label: "Overview", href: "/invoices" },
      { label: "All Invoices", href: "/invoices/all" },
      { label: "Draft", href: "/invoices/all?status=draft" },
      { label: "Approved", href: "/invoices/all?status=approved" },
      { label: "Sent", href: "/invoices/all?status=sent" },
      { label: "Paid", href: "/invoices/all?status=paid" },
      { label: "Overdue", href: "/invoices/all?status=overdue" },
      { label: "Reports", href: "/invoices/reports" },
    ],
  },
  clients: {
    title: "Clients",
    icon: Building2,
    items: [
      { label: "Overview", href: "/clients" },
      { label: "All Clients", href: "/clients/all" },
      { label: "Contacts", href: "/clients/contacts" },
      { label: "Contracts", href: "/clients/contracts" },
      { label: "Projects", href: "/clients/projects" },
      { label: "Invoices", href: "/clients/invoices" },
      { label: "Documents", href: "/clients/documents" },
    ],
  },
  talent: {
    title: "Talent",
    icon: Users,
    items: [
      { label: "Overview", href: "/talent" },
      { label: "Directory", href: "/talent/all" },
      { label: "Availability", href: "/talent/availability" },
      { label: "Assignments", href: "/talent/assignments" },
      { label: "Skills Matrix", href: "/talent/skills" },
      { label: "Documents", href: "/talent/documents" },
    ],
  },
  contracts: {
    title: "Contracts",
    icon: FileText,
    items: [
      { label: "Overview", href: "/contracts" },
      { label: "All Contracts", href: "/contracts/all" },
      { label: "Client Contracts", href: "/contracts/client" },
      { label: "Talent Contracts", href: "/contracts/talent" },
      { label: "Renewals", href: "/contracts/renewals" },
      { label: "Documents", href: "/contracts/documents" },
    ],
  },
  documents: {
    title: "Documents",
    icon: Files,
    items: [
      { label: "Overview", href: "/documents/all" },
      { label: "Clients", href: "/documents/all?type=client" },
      { label: "Talent", href: "/documents/all?type=talent" },
      { label: "Projects", href: "/documents/all?type=project" },
      { label: "Archive", href: "/documents/all?status=archived" },
    ],
  },
  finance: {
    title: "Finance",
    icon: DollarSign,
    items: [
      { label: "Overview", href: "/finance" },
      { label: "Capital", href: "/finance/capital" },
      { label: "Investments", href: "/finance/investments" },
      { label: "Budgets", href: "/finance/budgets" },
      { label: "Expenses", href: "/finance/expenses" },
    ],
  },
};

export function SecondarySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname?.split("/").filter(Boolean) || [];
  const activeModule = segments[0] || "";

  const config = sidebarConfig[activeModule];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Sidebar collapsible="none" className="hidden xl:flex h-screen w-64 border-l bg-transparent sticky top-0 border-card">
      <div className="absolute inset-0 z-[-1] bg-muted/20 pointer-events-none" />
      <SidebarContent className="p-4">
        <div className="flex items-center gap-3 mb-8 px-2 py-3 bg-card rounded-xl border border-card shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
                <Icon className="size-5" />
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-tight text-foreground/90 leading-none mb-1">{config.title}</h2>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Management</span>
            </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {config.items.map((item) => {
                const itemUrl = new URL(item.href, "http://localhost");
                const itemPath = itemUrl.pathname;
                
                const isActive = (() => {
                  if (pathname !== itemPath) return false;
                  
                  const itemSearchParams = itemUrl.searchParams;
                  const itemParamKeys = Array.from(itemSearchParams.keys());
                  
                  if (itemParamKeys.length === 0) {
                    return Array.from(searchParams.keys()).length === 0;
                  }
                  
                  return itemParamKeys.every((key) => {
                    return searchParams.get(key) === itemSearchParams.get(key);
                  });
                })();
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} className="rounded-xl px-3 py-5 transition-all duration-300 hover:bg-white/5 group">
                      <Link href={item.href} className="flex items-center w-full">
                        <span className={`text-sm ${isActive ? 'font-bold text-foreground' : 'font-medium text-muted-foreground group-hover:text-foreground/80'}`}>{item.label}</span>
                        {isActive && <ArrowRight className="ml-auto size-3.5 text-primary opacity-50" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}

export function SecondarySidebarSkeleton() {
  return (
    <Sidebar collapsible="none" className="hidden xl:flex h-screen w-64 border-l bg-transparent sticky top-0 border-card">
      <div className="absolute inset-0 z-[-1] bg-muted/20 pointer-events-none" />
      <SidebarContent className="p-4">
        <div className="flex items-center gap-3 mb-8 px-2 py-3 bg-card rounded-xl border border-card shadow-sm h-[62px]">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-2 w-12 bg-muted rounded animate-pulse" />
            </div>
        </div>

        <SidebarGroup>
          <div className="px-2 mb-2 h-3 w-16 bg-muted rounded animate-pulse" />
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {[...Array(6)].map((_, i) => (
                <SidebarMenuItem key={i}>
                  <div className="h-10 w-full rounded-xl bg-muted/50 animate-pulse my-1" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
