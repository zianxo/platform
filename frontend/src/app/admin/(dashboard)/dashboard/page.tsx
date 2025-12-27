"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAssignment, type ParentProject } from "@/lib/api";
import { useClientContext } from "@/components/providers/client-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, 
    Activity, 
    DollarSign, 
    TrendingUp, 
    Calendar,
    Download,
    Trophy
} from "lucide-react";
import { format } from "date-fns";
import { 
    Bar, 
    BarChart, 
    CartesianGrid, 
    LabelList, 
    XAxis, 
    Pie, 
    PieChart 
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function DashboardPage() {
    const { activeClient } = useClientContext();
    const [revenueView, setRevenueView] = useState<'client' | 'project'>('client');
    
    const { data: talent } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });
    const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
    const { data: allProjects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });
    const { data: allAssignments } = useQuery({ queryKey: ["assignments"], queryFn: api.projects.assignments.list });

    // Filter Data
    const projects = useMemo(() => {
        return activeClient 
            ? allProjects?.filter(p => p.client_id === activeClient.id) 
            : allProjects;
    }, [allProjects, activeClient]);

    const assignments = useMemo(() => {
        if (!activeClient) return allAssignments;
        const projectIds = new Set(projects?.map(p => p.id));
        return allAssignments?.filter(a => projectIds.has(a.project_id));
    }, [allAssignments, projects, activeClient]);

    // KPI Stats: MRR & Margins
    const stats = useMemo(() => {
        // Active Projects
        const activeProjects = projects?.filter(p => p.status === 'ACTIVE') || [];
        
        // MRR = Sum of Monthly Budget of Active Projects
        const mrr = activeProjects.reduce((sum, p) => sum + (p.monthly_budget || 0), 0);
        
        // Cost = Sum of Monthly Contractor Cost of Active Assignments
        const activeAssignments = assignments?.filter(a => a.status === 'ACTIVE') || [];
        const cost = activeAssignments.reduce((sum, a) => sum + (a.monthly_contractor_cost || 0), 0);
        
        const grossMargin = mrr - cost; // Revenue - Cost of Goods Sold (Talent)
        const marginPercent = mrr > 0 ? (grossMargin / mrr) * 100 : 0;
        const activeConsultants = new Set(activeAssignments.map(a => a.talent_id)).size;
        const totalProjects = activeProjects.length;

        // Calculate Trend (Growth over last month)
        // Heuristic: Sum of budgets of projects created > 30 days ago vs today
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const oldProjects = activeProjects.filter(p => new Date(p.created_at) < thirtyDaysAgo);
        const oldMrr = oldProjects.reduce((sum, p) => sum + (p.monthly_budget || 0), 0);
        
        const growth = oldMrr > 0 ? ((mrr - oldMrr) / oldMrr) * 100 : (mrr > 0 ? 100 : 0);

        return { mrr, grossMargin, marginPercent, activeConsultants, totalProjects, growth };
    }, [assignments, projects]);

    // Chart 1: Revenue by Client/Project
    const revenueData = useMemo(() => {
        if (!projects || !clients) return [];
        const map: Record<string, number> = {};
        
        // Sum active project budgets
        projects.filter(p => p.status === 'ACTIVE').forEach(p => {
             const key = revenueView === 'client' 
                ? clients.find(x => x.id === p.client_id)?.company_name 
                : p.name;
             
             if (key) {
                map[key] = (map[key] || 0) + (p.monthly_budget || 0);
             }
        });

        const colors = [
            "var(--chart-1)", 
            "var(--chart-2)", 
            "var(--chart-3)", 
            "var(--chart-4)", 
            "var(--chart-5)"
        ];
        
        return Object.entries(map)
            .map(([name, revenue], i) => ({ 
                name, 
                revenue,
                fill: colors[i % colors.length]
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [projects, clients, revenueView]);

    const revenueConfig = {
        revenue: { label: "Revenue", color: "var(--primary)" },
    } satisfies ChartConfig;

    // Chart 2: Assignments by Role (Pie)
    const roleData = useMemo(() => {
        if (!assignments) return [];
        const map: Record<string, number> = {};
        assignments.filter(a => a.status === 'ACTIVE').forEach(a => {
            map[a.role] = (map[a.role] || 0) + 1;
        });
        
        const colors = [
            "var(--chart-1)", 
            "var(--chart-2)", 
            "var(--chart-3)", 
            "var(--chart-4)", 
            "var(--chart-5)"
        ];

        return Object.entries(map)
            .map(([role, count], i) => ({ 
                role, 
                count, 
                fill: colors[i % colors.length] 
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [assignments]);

    const roleConfig = {
        count: { label: "Assignments" },
        ...Object.fromEntries(roleData.map((r, i) => [r.role, { label: r.role, color: `var(--chart-${i+1})` }]))
    } satisfies ChartConfig;

    // Top Talent (High Margin)
    const topTalent = useMemo(() => {
        if (!assignments || !talent || !projects) return [];
        return assignments
            .filter(a => a.status === 'ACTIVE')
            .map(a => {
               // Margin Calculation: Need Project Budget vs Assignment Cost
               // This is tricky per consultant if multiple consultants on one project.
               // Assuming simplistic PRO-RATA margin or just (ProjectBudget - Cost)? 
               // No, if I have 1 project ($10k) and 2 talent ($3k each), margin is $4k total.
               // Per talent margin contribution? 
               // For now, let's stick to (Revenue - Cost), but we don't know Revenue per talent anymore.
               // Let's use a proxy: (Project Monthly Budget / Active Assignments Count) - Cost
               
               const p = projects.find(x => x.id === a.project_id);
               // Fallback logic if counts are missing
               const activeCount = assignments.filter(x => x.project_id === a.project_id && x.status === 'ACTIVE').length || 1;
               const revenueShare = (p?.monthly_budget || 0) / activeCount;
               
               const margin = revenueShare - a.monthly_contractor_cost;
               const t = talent.find(x => x.id === a.talent_id);
               return { ...a, margin, talentName: t ? `${t.first_name} ${t.last_name}` : "Unknown" };
            })
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 3);
    }, [assignments, talent, projects]);
    
    // Download Report
    const handleDownloadReport = () => {
        const headers = ["Client,Project,Talent,Role,Start Date,Status,Revenue Share,Monthly Cost,Margin\n"];
        const rows = assignments?.map(a => {
            const p = allProjects?.find(x => x.id === a.project_id);
            const c = clients?.find(x => x.id === p?.client_id);
            const t = talent?.find(x => x.id === a.talent_id);
            
            const activeCount = assignments.filter(x => x.project_id === a.project_id && x.status === 'ACTIVE').length || 1;
            const revenueShare = (p?.monthly_budget || 0) / activeCount;
            const margin = revenueShare - a.monthly_contractor_cost;

            return `"${c?.company_name}","${p?.name}","${t?.first_name} ${t?.last_name}","${a.role}","${format(new Date(a.start_date), 'yyyy-MM-dd')}","${a.status}",${revenueShare.toFixed(2)},${a.monthly_contractor_cost},${margin.toFixed(2)}`;
        });
        
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows?.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dashboard_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Executive Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Performance overview {activeClient ? `for ${activeClient.company_name}` : "across all operations"}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Button onClick={handleDownloadReport}>
                        <Download className="mr-2 h-4 w-4" /> Download Report
                     </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 border-l-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className={`h-3 w-3 mr-1 ${stats.growth >= 0 ? "text-emerald-500" : "text-red-500"}`} />
                            <span className={`${stats.growth >= 0 ? "text-emerald-500" : "text-red-500"} font-medium`}>
                                {stats.growth > 0 ? "+" : ""}{stats.growth.toFixed(1)}%
                            </span> 
                            <span className="ml-1">vs 30 days ago</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 border-l-indigo-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gross Margin</CardTitle>
                        <Activity className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.grossMargin)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{stats.marginPercent.toFixed(1)}%</span> margin rate
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-card transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 border-l-blue-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Consultants</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeConsultants}</div>
                         <p className="text-xs text-muted-foreground mt-1">
                            Across {stats.totalProjects} active projects
                        </p>
                    </CardContent>
                </Card>
                
                 {/* Top Performer Mini-Card */}
                <Card className="glass-card transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 border-l-amber-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top Performer</CardTitle>
                        <Trophy className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold truncate">
                            {topTalent[0]?.talentName || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Highest margin contribution
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4 glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Revenue Distribution</CardTitle>
                            <CardDescription>Top revenue generating {revenueView === 'client' ? 'partnerships' : 'projects'}</CardDescription>
                        </div>
                        <Tabs value={revenueView} onValueChange={(v) => setRevenueView(v as 'client' | 'project')} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="client">Client</TabsTrigger>
                                <TabsTrigger value="project">Project</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={revenueConfig}>
                            <BarChart accessibilityLayer data={revenueData} margin={{ top: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.length > 10 ? `${value.slice(0, 10)}...` : value}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="revenue" radius={8}>
                                    <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} formatter={(value: number) => `$${(value/1000).toFixed(1)}k`} />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                        <div className="flex gap-2 leading-none font-medium">
                          Trending {stats.growth >= 0 ? "up" : "down"} by {Math.abs(stats.growth).toFixed(1)}% <TrendingUp className={`h-4 w-4 ${stats.growth < 0 ? "rotate-180 text-red-500" : ""}`} />
                        </div>
                        <div className="text-muted-foreground leading-none">
                          Showing top 5 {revenueView === 'client' ? 'clients' : 'projects'} by active monthly revenue
                        </div>
                    </CardFooter>
                </Card>

                {/* Assignments by Role Chart */}
                <Card className="col-span-3 glass-card flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Talent Distribution</CardTitle>
                        <CardDescription>Active assignments by role</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer config={roleConfig} className="mx-auto aspect-square max-h-[500px] w-full">
                            <PieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Pie 
                                    data={roleData} 
                                    dataKey="count" 
                                    nameKey="role" 
                                    innerRadius="60%" 
                                    outerRadius="90%"
                                    strokeWidth={5}
                                />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                     <CardFooter className="flex-col gap-2 text-sm">
                        <div className="text-muted-foreground leading-none">
                          Displaying top 5 active roles
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Bottom Section: Recent Activity & Top Talent List */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card">
                     <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest project assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assignments?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((activity, i) => {
                                const p = allProjects?.find(x => x.id === activity.project_id);
                                const t = talent?.find(x => x.id === activity.talent_id);
                                return (
                                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{t ? `${t.first_name} ${t.last_name}` : "Unknown Talent"}</p>
                                                <p className="text-xs text-muted-foreground">Assigned to {p?.name || "Project"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-muted-foreground">{format(new Date(activity.created_at), 'MMM d')}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="glass-card">
                     <CardHeader>
                        <CardTitle>Top Performing Talent</CardTitle>
                        <CardDescription>Highest margin contributors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                             {topTalent.map((t, i) => (
                                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                     <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
                                            #{i+1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{t.talentName}</p>
                                            <p className="text-xs text-muted-foreground">{t.role}</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-sm font-bold text-emerald-500">+{formatCurrency(t.margin)}/mo</p>
                                         <p className="text-xs text-muted-foreground">Margin</p>
                                     </div>
                                </div>
                             ))}
                             {topTalent.length === 0 && <p className="text-sm text-muted-foreground text-center">No data available.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
