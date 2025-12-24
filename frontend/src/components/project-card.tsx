"use client";

import Link from "next/link";
import { format } from "date-fns";
import { 
    Building2, 
    Calendar, 
    ArrowUpRight, 
    TrendingUp, 
    TrendingDown,
    DollarSign,
    Edit3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectCardProps {
    project: any;
    clientName?: string;
}

export function ProjectCard({ project, clientName }: ProjectCardProps) {
    const router = useRouter();
    const teamMembers = project.team_members || [];
    
    // Calculations
    const plannedRev = project.planned_monthly_revenue || 0;
    const actualRev = project.actual_monthly_revenue || 0;
    const actualCost = project.actual_monthly_cost || 0;
    const netProfit = actualRev - actualCost;
    const margin = actualRev > 0 ? ((actualRev - actualCost) / actualRev) * 100 : 0;
    const isProfitable = margin >= 0;
    const planExecution = plannedRev > 0 ? (actualRev / plannedRev) * 100 : 0;

    return (
        <Link href={`/projects/${project.id}`} className="group block h-full">
            <Card className="h-full border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col bg-card ring-1 ring-border/5">
                {/* Hover Indicator & Actions */}
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div 
                                    className="p-2 rounded-xl bg-background/40 backdrop-blur-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all border border-white/10 cursor-pointer shadow-lg"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        router.push(`/projects/${project.id}/edit`);
                                    }}
                                >
                                    <Edit3 className="size-4" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover/90 backdrop-blur-md border border-border">
                                <p className="font-bold text-muted-foreground">Edit</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <CardHeader className="pb-3 flex-none space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate pr-6">
                                {project.name}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <Building2 className="h-3 w-3" />
                                <span>{clientName || "Unknown Client"}</span>
                            </div>
                        </div>
                        <Badge 
                            variant={project.status === "ACTIVE" ? "default" : "secondary"}
                            className="h-5 text-[10px] font-bold uppercase tracking-wider"
                        >
                            {project.status}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-border/50 text-[10px] uppercase font-bold tracking-wider px-2 h-5 rounded-md">
                            {project.engagement_type?.replace(/_/g, " ") || "Fixed Price"}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                            <Calendar className="size-3" />
                            {format(new Date(project.created_at), 'MMM yyyy')}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col pt-0">
                    {/* Financial Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/30 rounded-xl border border-border/10 ring-1 ring-inset ring-white/5">
                        <div className="space-y-0.5">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Revenue</span>
                            <div className="font-bold text-xs truncate flex items-center gap-0.5 text-foreground">
                                <DollarSign className="size-3 text-muted-foreground" />
                                {Math.round(actualRev).toLocaleString()}
                            </div>
                        </div>
                        <div className="space-y-0.5 border-l pl-2 border-border/50">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Profit</span>
                            <div className={`font-bold text-xs truncate ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                ${Math.round(netProfit).toLocaleString()}
                            </div>
                        </div>
                        <div className="space-y-0.5 border-l pl-2 border-border/50">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Margin</span>
                            <div className={`font-bold text-xs flex items-center gap-0.5 ${isProfitable ? "text-emerald-500" : "text-rose-500"}`}>
                                {Math.round(margin)}%
                                {isProfitable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5em]">
                        {project.description || "No project description provided."}
                    </p>
                    
                    {/* Bottom Section */}
                    <div className="pt-2 mt-auto border-t border-border/50 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    <TooltipProvider>
                                        {teamMembers.slice(0, 3).map((m: any, idx: number) => (
                                            <Tooltip key={idx}>
                                                <TooltipTrigger asChild>
                                                    <div className="size-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-border/50 overflow-hidden">
                                                        {m.first_name[0]}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-popover/90 backdrop-blur-md border border-border">
                                                    <p className="font-bold">{m.first_name} {m.last_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </TooltipProvider>
                                    {teamMembers.length > 3 && (
                                        <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                            +{teamMembers.length - 3}
                                        </div>
                                    )}
                                    {teamMembers.length === 0 && (
                                        <span className="text-[10px] text-muted-foreground/60 italic">No team</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-foreground">${(Math.round(actualRev / 1000 * 10) / 10).toFixed(1)}k</div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-widest">MRR</div>
                            </div>
                        </div>
                        
                        {/* Plan Execution Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Plan Execution</span>
                                <span>{Math.round(planExecution)}%</span>
                            </div>
                            <div className="h-3 w-full bg-muted/20 rounded-full p-[3px] border border-border/10">
                                <div className="h-full w-full bg-background/40 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, Math.round(planExecution))}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
