"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  TrendingUp,
  Clock,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useClientContext } from "@/components/providers/client-provider";
import { useMemo } from "react";

export default function InvoicesOverviewPage() {
  const { activeClient } = useClientContext();
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.invoices.list,
  });

  const invoices = useMemo(() => {
    if (!invoicesData) return [];
    if (!activeClient) return invoicesData;
    return invoicesData.filter(inv => inv.client_id === activeClient.id);
  }, [invoicesData, activeClient]);

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

  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(i => i.status === 'PAID').length || 0;
  const overdueInvoices = invoices?.filter(i => i.status === 'OVERDUE').length || 0;
  const draftInvoices = invoices?.filter(i => i.status === 'DRAFT').length || 0;
  
  const totalValue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  const paidValue = invoices?.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  const overdueValue = invoices?.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Invoices Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage financial operations and collection efficiency.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none"
          >
            <Link href="/invoices/new">
              <Plus className="size-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: `$${(totalValue / 1000).toFixed(1)}k`, sub: "Total volume generated", icon: FileText, color: "primary" },
          { label: "Cash Collected", value: `$${(paidValue / 1000).toFixed(1)}k`, sub: `${((paidValue/totalValue)*100).toFixed(0)}% collection rate`, icon: CheckCircle2, color: "emerald", trend: "up" },
          { label: "Accounts Receivable", value: `$${(overdueValue / 1000).toFixed(1)}k`, sub: `${overdueInvoices} overdue payments`, icon: AlertCircle, color: "rose", trend: "down" },
          { label: "Pending Review", value: draftInvoices.toString(), sub: "Invoices in draft status", icon: Clock, color: "amber" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${
                    stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                    stat.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : 
                    stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                }`}>
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
        {/* Recent Activity / Quick Look */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Financial Flow</CardTitle>
                    <p className="text-xs text-muted-foreground">Recent invoicing cycles and performance</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">Live Feed</Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="mt-6 space-y-4">
                    {invoices?.slice(0, 5).map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold truncate max-w-[150px]">INV-{inv.id.slice(0,8)}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{inv.billing_month}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-black">${inv.total_amount.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold">{inv.currency}</div>
                                </div>
                                <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                                    inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                                    inv.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>
                                    {inv.status}
                                </Badge>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary" asChild>
                    <Link href="/invoices/all">View All Invoices</Link>
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
