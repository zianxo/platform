"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  Briefcase, 
  Plus, 
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Building2,
  Users
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { ProjectCard } from "@/components/project-card";
import Link from "next/link";

export default function ClientProjectsPage() {
  const [search, setSearch] = useState("");
  
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      const clientName = clients?.find(c => c.id === p.client_id)?.company_name || "";
      return p.name.toLowerCase().includes(search.toLowerCase()) || 
             clientName.toLowerCase().includes(search.toLowerCase());
    });
  }, [projects, clients, search]);

  if (projectsLoading || clientsLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(6)].map((_, i) => (
             <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 mb-2">
            Client Engagements
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Active projects and initiatives across your client portfolio.</p>
        </div>
        <Button asChild className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6">
          <Link href="/projects/new">
            <Plus className="size-4 mr-2" />
            Assign Project
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="px-2">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search projects by name or client..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {filteredProjects.map((p) => {
          const clientName = clients?.find(c => c.id === p.client_id)?.company_name || "Unknown Client";
          return <ProjectCard key={p.id} project={p} clientName={clientName} />;
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <Briefcase className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">No projects found</h3>
            <p className="text-muted-foreground font-medium">Try searching for a different project name or client.</p>
          </div>
        )}
      </div>
    </div>
  );
}
