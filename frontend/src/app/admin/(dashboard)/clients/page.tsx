"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Building2, 
  Users, 
  Briefcase, 
  Plus, 
  ArrowUpRight, 
  TrendingUp,
  Globe,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function ClientsOverviewPage() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const activeClients = clients?.filter(c => c.status === 'ACTIVE') || [];
  const totalClients = clients?.length || 0;
  const activeCount = activeClients.length;
  
  // Mock some metrics since they aren't directly in the model but would be in a real dashboard
  const retentionRate = 94;
  const avgEngagementLength = "14 Months";

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Clients Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage partnerships, client relations, and portfolio health.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6"
          >
            <Link href="/clients/new">
              <Plus className="size-4 mr-2" />
              Add New Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Partners", value: activeCount.toString(), sub: `Out of ${totalClients} total`, icon: Building2, color: "primary" },
          { label: "Client Retention", value: `${retentionRate}%`, sub: "+2% from last quarter", icon: ShieldCheck, color: "emerald", trend: "up" },
          { label: "Avg Engagement", value: avgEngagementLength, sub: "Long-term relationships", icon: Clock, color: "indigo" },
          { label: "Growth Target", value: "82%", sub: "Annual goal progress", icon: Target, color: "amber", trend: "up" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${
                    stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                    stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500' : 
                    stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                }`}>
                    {/* @ts-ignore */}
                    <stat.icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tight">{stat.value}</div>
                <div className="flex items-center mt-1">
                    {stat.trend === "up" && <ArrowUpRight className="size-3 text-emerald-500 mr-1" />}
                    <span className="text-xs font-medium text-muted-foreground">{stat.sub}</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Priority Partners Feed */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Priority Partners</CardTitle>
                    <p className="text-xs text-muted-foreground">Most active client engagements</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">Top Tier</Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="mt-6 space-y-4">
                    {activeClients.slice(0, 5).map((client) => {
                       const clientProjects = projects?.filter(p => p.client_id === client.id) || [];
                       return (
                        <Link key={client.id} href={`/clients/${client.id}`} className="block">
                          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-lg bg-card border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                      <Building2 className="size-6" />
                                  </div>
                                  <div>
                                      <div className="text-sm font-bold truncate max-w-[200px]">{client.company_name}</div>
                                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{client.industry || "General Services"}</div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6">
                                  <div className="text-right hidden sm:block">
                                      <div className="text-sm font-black">{clientProjects.length} Projects</div>
                                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Active engagements</div>
                                  </div>
                                  <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-0`}>
                                      {client.status}
                                  </Badge>
                                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                              </div>
                          </div>
                        </Link>
                       );
                    })}
                </div>
                <Button variant="ghost" className="w-full mt-6 rounded-lg font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary" asChild>
                    <Link href="/clients/all">View All Clients</Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
