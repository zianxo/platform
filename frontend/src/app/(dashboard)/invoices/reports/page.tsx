"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  FileText,
  Calendar,
  ChevronRight,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import Link from "next/link";

export default function InvoiceReportsPage() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.invoices.list,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[450px] w-full rounded-xl" />
      </div>
    );
  }

  // Aggregate Data
  const totalInvoiced = invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0;
  const totalPaid = invoices?.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.total_amount, 0) || 0;
  const totalOverdue = invoices?.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.total_amount, 0) || 0;

  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

  // Mock Trend Data for Chart
  const trendData = [
    { month: "Jan", revenue: 45000, collection: 42000 },
    { month: "Feb", revenue: 52000, collection: 48000 },
    { month: "Mar", revenue: 48000, collection: 41000 },
    { month: "Apr", revenue: 61000, collection: 58000 },
    { month: "May", revenue: 55000, collection: 52000 },
    { month: "Jun", revenue: 67000, collection: 63000 },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Internal Analytics</div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Financial Intelligence
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Detailed revenue performance and collection efficiency reports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold border-border/60 hover:bg-muted/50 gap-2">
            <Download className="size-4" /> Export PDF
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6">
            <Filter className="size-4 mr-2" /> Filter Period
          </Button>
        </div>
      </div>

      {/* Primary Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <HighlightCard 
          label="Collection Pipeline" 
          value={`$${(totalInvoiced / 1000).toFixed(1)}k`} 
          sub="Total volume generated" 
          icon={DollarSign}
          trend="+8.2%"
          trendDir="up"
        />
        <HighlightCard 
          label="Effective Liquidity" 
          value={`$${(totalPaid / 1000).toFixed(1)}k`} 
          sub={`${collectionRate.toFixed(1)}% collection rate`} 
          icon={TrendingUp}
          trend="+12.4%"
          trendDir="up"
          color="emerald"
        />
        <HighlightCard 
          label="Outstanding Risk" 
          value={`$${(totalOverdue / 1000).toFixed(1)}k`} 
          sub={`${invoices?.filter(i => i.status === 'OVERDUE').length} overdue entities`} 
          icon={Clock}
          trend="-3.1%"
          trendDir="down"
          color="rose"
        />
      </div>

      {/* Revenue Performance Chart */}
      <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="px-8 pt-8 flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-xl font-bold tracking-tight">Revenue Progression</CardTitle>
                <p className="text-xs text-muted-foreground">Monthly billing vs actual collection performance</p>
            </div>
            <div className="flex gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    <div className="size-2 rounded-full bg-primary" /> Revenue
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-500">
                    <div className="size-2 rounded-full bg-emerald-500" /> Collection
                </div>
            </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
            <div className="h-[350px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis 
                            dataKey="month" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fill: 'var(--muted-foreground)'}} 
                        />
                        <YAxis 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fill: 'var(--muted-foreground)'}}
                            tickFormatter={(v) => `$${v/1000}k`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--popover)', 
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        <Area type="monotone" dataKey="collection" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorColl)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>

      {/* Secondary Data Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-bold">Billing Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Invoicing distribution by category</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
                {[
                    { label: "Fixed Fee Engagement", amount: "$124,000", share: 64, color: "bg-primary" },
                    { label: "Time & Materials", amount: "$45,200", share: 23, color: "bg-indigo-500" },
                    { label: "Opex & Expenses", amount: "$12,800", share: 13, color: "bg-emerald-500" },
                ].map((item, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                            <span>{item.label}</span>
                            <span>{item.amount}</span>
                        </div>
                        <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.share}%` }} />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="px-8 pt-8">
                <CardTitle className="text-lg font-bold">Efficiency Metics</CardTitle>
                <p className="text-xs text-muted-foreground">Operational performance indicators</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 grid grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-muted/20 border border-border/10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg Pay Cycle</div>
                    <div className="text-2xl font-black">14.2 Days</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-1">Efficient</div>
                </div>
                <div className="p-6 rounded-xl bg-muted/20 border border-border/10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">DSO Rating</div>
                    <div className="text-2xl font-black">28 Days</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-1">Above Avg</div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HighlightCard({ label, value, sub, icon: Icon, trend, trendDir, color }: any) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    rose: "bg-rose-500/10 text-rose-500",
    primary: "bg-primary/10 text-primary"
  };

  return (
    <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
        <div className={`p-2 rounded-lg ${colorMap[color as keyof typeof colorMap] || colorMap.primary}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <div className="flex items-center mt-1">
          {trendDir === 'up' ? <ArrowUpRight className="size-3 text-emerald-500 mr-1" /> : <ArrowDownRight className="size-3 text-rose-500 mr-1" />}
          <span className="text-xs font-medium text-emerald-500 mr-2">{trend}</span>
          <span className="text-xs font-medium text-muted-foreground">{sub}</span>
        </div>
      </CardContent>
    </Card>
  );
}
