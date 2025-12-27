"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAssignment } from "@/lib/api";
import { 
  Briefcase, 
  Calendar, 
  User, 
  ChevronRight, 
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

export default function AssignmentsPage() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: api.projects.assignments.list,
  });

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });
  const { data: talent } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });

  if (isLoading) {
    return (
      <div className="space-y-8 p-2">
         <Skeleton className="h-10 w-48 rounded-xl" />
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
         </div>
      </div>
    );
  }

  const getProjectName = (id: string) => projects?.find(p => p.id === id)?.name || "Unknown Project";
  const getTalent = (id: string) => talent?.find(t => t.id === id);

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Project Assignments</h1>
        <p className="text-muted-foreground text-sm font-medium">Track active consultant placements across all client projects.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {assignments?.map((a: ProjectAssignment) => {
          const t = getTalent(a.talent_id);
          const isActive = a.status === 'ACTIVE';

          return (
            <Card key={a.id} className="group overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
               <CardContent className="p-0">
                  <div className="p-8 pb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-12 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Briefcase className="size-6" />
                        </div>
                        <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                            isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/50 text-muted-foreground border-border/50"
                        }`}>
                            {isActive ? <CheckCircle2 className="size-2.5 mr-1" /> : <Clock className="size-2.5 mr-1" />}
                            {a.status}
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-black tracking-tight truncate group-hover:text-primary transition-colors">
                                {getProjectName(a.project_id)}
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase">{a.role}</p>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/10 group/item hover:border-primary/20 transition-all">
                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {t?.first_name?.[0]}{t?.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">
                                    {t?.first_name} {t?.last_name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider">
                                    Consultant
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="size-8 rounded-lg" asChild>
                                <Link href={`/talent/${t?.id}`}><ExternalLink className="size-4" /></Link>
                            </Button>
                        </div>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-muted/20 border-t border-border/40 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar className="size-3.5" />
                        {format(new Date(a.start_date), "MMM d, yyyy")}
                     </div>
                     <Link href={`/projects/${a.project_id}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                        Project Info
                        <ArrowUpRight className="size-3" />
                     </Link>
                  </div>
               </CardContent>
            </Card>
          );
        })}

        {assignments?.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <Users className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">No assignments active</h3>
            <p className="text-muted-foreground font-medium">Currently no consultants are assigned to projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
