"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  Download, 
  CreditCard, 
  Wallet, 
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  LayoutGrid,
  History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useClientContext } from "@/components/providers/client-provider";

export default function PaymentsPage() {
  const { activeClient } = useClientContext();
  const [search, setSearch] = useState("");
  
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: api.payments.list,
  });

  const payments = useMemo(() => {
    if (!paymentsData) return [];
    if (!activeClient) return paymentsData;
    // In this model, payments might not be directly linked to clients, 
    // but in a real system they would be linked via projects/invoices.
    // For now, we'll assume filtering by a related property or just showing context awareness.
    return paymentsData; 
  }, [paymentsData, activeClient]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.billing_month.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [payments, search]);

  const totalPaid = payments?.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingPayments = payments?.filter(p => p.status !== 'PAID').length || 0;
  const lastMonthPaid = payments?.filter(p => p.status === 'PAID').slice(0, 1).reduce((sum, p) => sum + p.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
           <Skeleton className="h-32 w-full rounded-xl" />
           <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Disbursements
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Track outgoing talent payouts and historical billing volumes.</p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6">
          <Plus className="size-4 mr-2" />
          Queue Payment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Total Disbursed", value: `$${totalPaid.toLocaleString()}`, sub: "Lifetime payout volume", icon: Wallet, color: "emerald", trend: "up" },
          { label: "Pending Queue", value: pendingPayments.toString(), sub: "Payouts awaiting processing", icon: Clock, color: "amber" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${
                    stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 
                    stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                }`}>
                    <stat.icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                <div className="flex items-center mt-1 text-xs font-medium text-muted-foreground">
                    {stat.trend === "up" && <ArrowUpRight className="size-3 text-emerald-500 mr-1" />}
                    {stat.sub}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Payment History Feed */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Payment Ledger</CardTitle>
                    <p className="text-xs text-muted-foreground">Recent disbursements and pending transfers</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">History</Badge>
            </CardHeader>
            <CardContent className="px-8 pb-8">
                <div className="mt-6 space-y-4">
                    {filteredPayments.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold truncate max-w-[150px]">{p.billing_month} Payout</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ID: {p.id.slice(0, 13)}...</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-black">${p.amount.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold">USD</div>
                                </div>
                                <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                                    p.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                                } border-0`}>
                                    {p.status}
                                </Badge>
                                <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
