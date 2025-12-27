"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ProjectCard } from "@/components/project-card";

export default function ClientProjectsPage() {
    const { data: projects, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: api.projects.list
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 rounded-md" />
                        <Skeleton className="h-4 w-64 mt-2 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Active Projects</h1>
                    <p className="text-muted-foreground mt-2">Monitor your active engagements and track progress.</p>
                </div>
                <Button asChild className="rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/projects/new">
                        <Plus className="size-4 mr-2" />
                        New Project
                    </Link>
                </Button>
            </div>

            {projects && projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                         // Using the shared ProjectCard but we might need to adjust it if it has admin-specific links. 
                         // The existing ProjectCard links to /projects/[id], checking where that goes.
                         // Admin: /projects/[id]
                         // Client: We probably want /client/projects/[id]? 
                         // But the current routing layout.tsx defines "/projects" for clients.
                         // So if the card links to /projects/[id], it will go to /client/projects/[id] because of middleware/layout context? 
                         // Wait, layout links are relative or absolute?
                         // If ProjectCard uses Link href="/projects/${id}", on client domain "app.localhost", it goes to /projects/[id].
                         // Middleware rewrites to /client/projects/[id].
                         // So we need to ensure /client/projects/[id] exists. It does! I saw [id] folder in ls.
                        <div key={project.id} className="h-[280px]">
                            <ProjectCard project={project} clientName="" />
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                            <Briefcase className="size-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No active projects</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-[300px]">Start a new engagement to get precise engineering power.</p>
                        <Button asChild size="lg" className="rounded-xl font-bold">
                            <Link href="/projects/new">Start Project</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
