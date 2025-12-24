"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight,
  Search,
  LayoutGrid
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useState, useMemo, useEffect, Suspense } from "react";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";

import { useClientContext } from "@/components/providers/client-provider";
import { ProjectCard } from "@/components/project-card";
import { useSearchParams, useRouter, usePathname } from "next/navigation";


function ProjectsDashboardSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

function ProjectsDashboardContent() {
  const { activeClient } = useClientContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.toUpperCase() : "all";
  });

  // Reactive sync with URL
  useEffect(() => {
    const status = searchParams.get("status");
    const normalized = status ? status.toUpperCase() : "all";
    if (normalized !== statusFilter) {
      setStatusFilter(normalized);
    }
  }, [searchParams, statusFilter]);

  // Sync status filter with URL
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
        params.delete("status");
    } else {
        params.set("status", value);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const projects = useMemo(() => {
    if (!projectsData) return [];
    if (!activeClient) return projectsData;
    return projectsData.filter(p => p.client_id === activeClient.id);
  }, [projectsData, activeClient]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  if (isLoading) {
    return <ProjectsDashboardSkeleton />;
  }

  // Analytics Aggregation (Always base on all projects or filtered? Usually dashboard stats are for all, but maybe filtered is better)
  const activeProjectsList = projects?.filter(p => p.status === 'ACTIVE') || [];
  const totalProjects = projects?.length || 0;
  
  const totalPlannedMRR = projects?.reduce((acc, curr) => acc + (curr.planned_monthly_revenue || 0), 0) || 0;
  const totalActualMRR = projects?.reduce((acc, curr) => acc + (curr.actual_monthly_revenue || 0), 0) || 0;
  const totalActualCost = projects?.reduce((acc, curr) => acc + (curr.actual_monthly_cost || 0), 0) || 0;
  
  const totalProfit = totalActualMRR - totalActualCost;
  const avgMargin = totalActualMRR > 0 ? (totalProfit / totalActualMRR) * 100 : 0;
  
  const totalTalentCount = projects?.reduce((acc, curr) => acc + (curr.active_assignments_count || 0), 0) || 0;
  const mrrPerformance = totalPlannedMRR > 0 ? (totalActualMRR / totalPlannedMRR) * 100 : 100;

  const revenueData = activeProjectsList.slice(0, 5).map(p => ({
    name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
    actual: Math.round(p.actual_monthly_revenue || 0),
    planned: Math.round(p.planned_monthly_revenue || 0),
  }));

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Projects Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Monitor financial performance and resource allocation.
          </p>
        </div>
        <div className="flex gap-3">
            <Link href="/projects/new">
                <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20">
                    <Plus className="mr-2 size-4" /> Create Project
                </Button>
            </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Actual MRR", value: `$${Math.round(totalActualMRR).toLocaleString()}`, sub: `${mrrPerformance.toFixed(1)}% of plan`, icon: DollarSign, trend: totalActualMRR >= totalPlannedMRR ? "up" : "down" },
          { label: "Net Profit", value: `$${Math.round(totalProfit).toLocaleString()}`, sub: `${avgMargin.toFixed(1)}% avg margin`, icon: TrendingUp, trend: "up" },
          { label: "Active Talent", value: totalTalentCount, sub: "Across projects", icon: Users, trend: "neutral" },
          { label: "Active Projects", value: activeProjectsList.length, sub: `Out of ${totalProjects} total`, icon: Briefcase, trend: "neutral" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50  bg-card shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <div className="flex items-center mt-1">
                    {stat.trend === "up" && <ArrowUpRight className="size-3 text-emerald-500 mr-1" />}
                    {stat.trend === "down" && <ArrowDownRight className="size-3 text-rose-500 mr-1" />}
                    <span className="text-xs font-medium text-muted-foreground">{stat.sub}</span>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>


      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Distribution Chart */}
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm ring-1 ring-border/5">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold tracking-tight">Financial Performance</CardTitle>
                    <p className="text-xs text-muted-foreground">Actual vs Planned Revenue by Top Projects</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold px-3">Top 5 Projects</Badge>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                            <XAxis 
                                dataKey="name" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tick={{fill: 'var(--muted-foreground)'}} 
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{fill: 'var(--muted)', opacity: 0.1}}
                                contentStyle={{ 
                                    backgroundColor: 'var(--popover)', 
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                            <Bar dataKey="actual" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
                            <Bar dataKey="planned" fill="var(--muted)" radius={[4, 4, 0, 0]} barSize={24} opacity={0.3} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Project Health / Margin Quick List */}
        <Card className="border-border/50 bg-card shadow-sm ring-1 ring-border/5">
            <CardHeader>
                <CardTitle className="text-lg font-bold tracking-tight">Profit Margins</CardTitle>
                <p className="text-xs text-muted-foreground">Highest performing projects</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                {activeProjectsList.slice(0, 5).map((p) => {
                    const margin = p.actual_monthly_revenue && p.actual_monthly_revenue > 0 
                        ? ((p.actual_monthly_revenue - (p.actual_monthly_cost || 0)) / p.actual_monthly_revenue) * 100 
                        : 0;
                    return (
                        <div key={p.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.name}</span>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest leading-none">
                                    {p.active_assignments_count} Team Members
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className={`text-sm font-black ${margin > 30 ? 'text-emerald-500' : margin > 15 ? 'text-blue-500' : 'text-amber-500'}`}>
                                        {margin.toFixed(0)}%
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">margin</div>
                                </div>
                                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    );
                })}
                {activeProjectsList.length === 0 && <p className="text-sm text-center text-muted-foreground py-10">No active projects data.</p>}
            </CardContent>
        </Card>
      </div>

      {/* Detailed Projects Grid */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                Portfolio Health
                <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-0 font-bold px-2 py-0.5">
                    {filteredProjects.length} Result{filteredProjects.length !== 1 ? 's' : ''}
                </Badge>
            </h2>
            
            <div className="flex flex-col md:flex-row gap-3 flex-1 md:max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search projects..." 
                        className="pl-10 h-9 rounded-xl bg-card border-border/50 focus-visible:ring-primary/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full md:w-[140px] h-9 rounded-xl bg-card border-border/50">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/90 backdrop-blur-xl border-border">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PLANNED">Planned</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
                const clientName = clients?.find((c: any) => c.id === p.client_id)?.company_name;
                return <ProjectCard key={p.id} project={p} clientName={clientName} />;
            })}
            {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 text-center rounded-xl border-dashed border-2 border-border/50">
                    <LayoutGrid className="size-10 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-muted-foreground">No projects found</h3>
                    <p className="text-sm text-muted-foreground/60">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsDashboard() {
  return (
    <Suspense fallback={<ProjectsDashboardSkeleton />}>
      <ProjectsDashboardContent />
    </Suspense>
  );
}
