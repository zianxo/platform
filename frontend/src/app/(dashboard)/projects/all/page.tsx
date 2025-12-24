"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Skeleton } from "@/components/ui/skeleton";
import { useClientContext } from "@/components/providers/client-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
    Plus, 
    Users, 
    Building2, 
    Calendar, 
    TrendingUp, 
    TrendingDown, 
    DollarSign,
    Search,
    LayoutGrid
} from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function ProjectsPageContent() {
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
    return projectsData?.filter(p => p.client_id === activeClient.id);
  }, [projectsData, activeClient]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.description?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  if (isLoading) {
    return <ProjectsListSkeleton />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Projects
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage ongoing initiatives and engagements.
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="mr-2 size-4" /> New Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-3">
                All Projects
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-xl border-dashed border-2 border-border/50">
            <LayoutGrid className="size-10 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground">No projects found</h3>
            <p className="text-sm text-muted-foreground/60">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
             const clientName = clients?.find(c => c.id === project.client_id)?.company_name;
             return <ProjectCard key={project.id} project={project} clientName={clientName} />;
          })
        )}
      </div>
    </div>
  );
}


function ProjectsListSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <Skeleton className="h-10 w-48 rounded-xl mb-2" />
        <Skeleton className="h-4 w-96 rounded-xl" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 px-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full max-w-md rounded-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsListSkeleton />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
