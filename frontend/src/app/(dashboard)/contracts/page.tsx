"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  Plus, 
  Activity,
  Calendar,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  FileText,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useClientContext } from "@/components/providers/client-provider";
import { useMemo } from "react";

export default function ContractsOverviewPage() {
  const { activeClient } = useClientContext();
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: api.contracts.list,
  });

  const contracts = useMemo(() => {
    if (!contractsData) return [];
    if (!activeClient) return contractsData;
    return contractsData.filter(c => c.client_id === activeClient.id);
  }, [contractsData, activeClient]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const activeContractsList = contracts?.filter(c => c.status === 'SIGNED' || c.status === 'ACTIVE') || [];
  const activeCount = activeContractsList.length;
  const pendingCount = contracts?.filter(c => c.status === 'SENT' || c.status === 'DRAFT').length || 0;
  const expiredCount = contracts?.filter(c => c.status === 'EXPIRED').length || 0;

  const renewalSoon = contracts?.filter(c => {
    if (!c.end_date) return false;
    const days = Math.floor((new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return days > 0 && days < 30;
  }).length || 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Contracts Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage legal agreements, MSAs, and SOWs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="rounded-xl shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-none"
          >
            <Link href="/contracts/new">
              <Plus className="size-4 mr-2" />
              New Contract
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Agreements", value: activeCount.toString(), sub: "Signed & valid", icon: ShieldCheck, color: "indigo" },
          { label: "Pending Signatures", value: pendingCount.toString(), sub: "Awaiting review", icon: FileSignature, color: "amber" },
          { label: "Accounts Expired", value: expiredCount.toString(), sub: "Historical records", icon: AlertCircle, color: "rose" },
          { label: "Renewals Due", value: renewalSoon.toString(), sub: "Next 30 days", icon: Calendar, color: "primary" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${
                    stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500' : 
                    stat.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : 
                    stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                }`}>
                    <stat.icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-black tracking-tight">{stat.value}</div>
                <div className="flex items-center mt-1 text-xs font-medium text-muted-foreground">
                    {stat.sub}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Active Agreements Feed */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Active Agreements</CardTitle>
                    <p className="text-xs text-muted-foreground">Most recent operative contracts</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">Operative</Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="mt-6 space-y-4">
                    {activeContractsList.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                    <FileSignature className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold truncate max-w-[150px]">{c.type} Agreement</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Effectivity: {format(new Date(c.start_date), 'MMM d, yyyy')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs font-bold text-muted-foreground uppercase">{c.notice_period_days} Day Notice</div>
                                </div>
                                <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-0`}>
                                    SIGNED
                                </Badge>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 rounded-lg font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary" asChild>
                    <Link href="/contracts/all">View All Contracts</Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
