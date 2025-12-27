"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type ParentProject } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, Users, Clock, Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClientProjectDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [project, setProject] = useState<ParentProject | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProject() {
            try {
                const data = await api.projects.get(id);
                setProject(data);
            } catch (error) {
                console.error("Failed to fetch project:", error);
            } finally {
                setLoading(false);
            }
        }
        if (id) {
            fetchProject();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">Project Not Found</h1>
                <Link href="/" className="text-primary hover:underline mt-4 block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    // Client view: "Revenue" is their "Spend"
    // We do NOT show actual_monthly_cost (that's internal cost)
    const currentSpend = project.actual_monthly_revenue || 0;
    const budget = project.monthly_budget || 0;
    const utilization = budget > 0 ? (currentSpend / budget) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {project.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{project.description}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Deployment / Logistics */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Engagement Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Type</span>
                            <div className="font-medium capitalize">{project.engagement_type?.replace(/_/g, " ").toLowerCase() || "N/A"}</div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Start Date</span>
                            <div className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Team Size</span>
                            <div className="font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {project.team_members?.length || 0} Members
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Weekly Hours</span>
                            <div className="font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {project.current_weekly_hours || 0} hrs / week
                            </div>
                         </div>
                    </CardContent>
                </Card>

                {/* Financial Overview (Client Facing) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Financials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Monthly Budget</span>
                            <div className="text-2xl font-bold mt-1">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget)}
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Current Monthly Spend</span>
                                <span className="text-xs font-medium">{Math.round(utilization)}% of budget</span>
                            </div>
                            <div className="text-xl font-bold">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentSpend)}
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${utilization > 100 ? 'bg-red-500' : 'bg-primary'} transition-all`} 
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Team */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Assigned Talent</CardTitle>
                    <CardDescription>Professionals currently active on this project.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!project.team_members || project.team_members.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No team members assigned yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {project.team_members.map((member) => (
                                <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card/50">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {member.first_name[0]}{member.last_name[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium">{member.first_name} {member.last_name}</div>
                                        <div className="text-sm text-muted-foreground">{member.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
