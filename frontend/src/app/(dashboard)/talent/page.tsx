
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Users, 
  CheckCircle2, 
  Briefcase, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  ChevronRight,
  Target,
  Globe,
  Star,
  Zap,
  Edit3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

const utilizationData = [
  { month: "Jan", rate: 82 },
  { month: "Feb", rate: 85 },
  { month: "Mar", rate: 88 },
  { month: "Apr", rate: 84 },
  { month: "May", rate: 89 },
  { month: "Jun", rate: 92 },
];

export default function TalentOverviewPage() {
  const router = useRouter();
  const { data: talents, isLoading } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const totalTalent = talents?.length || 0;
  const onBench = talents?.filter(t => t.status?.toUpperCase() === 'AVAILABLE' || t.status?.toUpperCase() === 'BENCH').length || 0;
  const activeAssignments = talents?.filter(t => t.status?.toUpperCase() === 'ASSIGNED' || t.status?.toUpperCase() === 'ACTIVE').length || 0;
  const utilizationRate = totalTalent > 0 ? (activeAssignments / totalTalent) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Talent Hub
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage consultant bench, skills, and utilization.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            asChild
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none"
          >
            <Link href="/talent/new">
              <Plus className="size-4 mr-2" />
              Add Consultant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Consultants", value: totalTalent.toString(), sub: "Registered talent pool", icon: Users, color: "primary" },
          { label: "On Bench", value: onBench.toString(), sub: `${((onBench/totalTalent)*100).toFixed(0)}% availability`, icon: CheckCircle2, color: "emerald" },
          { label: "Active Roles", value: activeAssignments.toString(), sub: "Currently assigned", icon: Briefcase, color: "indigo" },
          { label: "Avg Utilization", value: `${utilizationRate.toFixed(0)}%`, sub: "Resource efficiency", icon: TrendingUp, color: "amber", trend: "up" },
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Utilization Chart */}
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 pt-8">
                <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Utilization Trends</CardTitle>
                    <p className="text-xs text-muted-foreground">Historical bench vs active assignment ratio</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">H1 2024</Badge>
            </CardHeader>
            <CardContent className="px-4 pb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={utilizationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600}} 
                        />
                        <YAxis 
                            hide 
                            domain={[0, 100]}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--popover)', 
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="var(--primary)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRate)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Recent Additions / High Potentials */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
            <CardHeader className="px-8 pt-8">
                <CardTitle className="text-xl font-bold tracking-tight">Recent Additions</CardTitle>
                <p className="text-xs text-muted-foreground">Newly registered consultants</p>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
                {talents?.slice(0, 4).map((talent) => (
                    <Link href={`/talent/${talent.id}`} key={talent.id}>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10 group hover:border-primary/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                                    {talent.first_name?.[0]}{talent.last_name?.[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold truncate max-w-[120px] group-hover:text-primary transition-colors">
                                        {talent.first_name} {talent.last_name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        {talent.role || "Consultant"}
                                    </div>
                                </div>
                            </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all bg-background/40 backdrop-blur-sm hover:bg-primary/20 hover:text-primary border border-white/10 shadow-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/talent/${talent.id}/edit`);
                            }}
                        >
                            <Edit3 className="size-3.5" />
                        </Button>
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </Link>
                ))}
                
                <Button variant="outline" className="w-full mt-4 rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary border-border/60" asChild>
                    <Link href="/talent/all">Browse Directory</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
          <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5 rounded-xl overflow-hidden">
              <CardHeader className="px-8 pt-8">
                  <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                          <Target className="size-4" />
                      </div>
                      <CardTitle className="text-lg font-bold tracking-tight">Skill Matrix</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">Consultant competency distribution (by Role)</p>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                  <div className="space-y-4">
                      {Object.entries(
                        (talents || []).reduce((acc: any, t: any) => {
                            const role = t.role || "Other";
                            acc[role] = (acc[role] || 0) + 1;
                            return acc;
                        }, {})
                      )
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .slice(0, 5)
                      .map(([role, count]: any, i) => (
                        <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                <span>{role}</span>
                                <span className="text-muted-foreground">{count} Experts</span>
                            </div>
                            <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500" 
                                    style={{ width: `${(count / (totalTalent || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                      ))}
                      {totalTalent === 0 && <p className="text-sm text-muted-foreground text-center py-4">No talent data available.</p>}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
