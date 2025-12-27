"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type TeamMember } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProjectResourcesPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  if (isLoading) return <div className="p-8">Loading resources...</div>;

  // Flatten team members from all projects
  const resources = projects?.flatMap(p => 
    p.team_members?.map(tm => ({ ...tm, project_name: p.name, project_id: p.id })) || []
  ) || [];

  return (
     <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Project Resources
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Team members assigned across all active projects.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm ring-1 ring-border/5 overflow-hidden">
         <Table>
            <TableHeader>
                <TableRow>
                     <TableHead>Resource</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead>Project</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {resources.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">No resources assigned to projects.</TableCell>
                    </TableRow>
                ) : (
                    resources.map((r, idx) => (
                        <TableRow key={`${r.id}-${idx}`}>
                             <TableCell className="flex items-center gap-2 font-medium">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{r.first_name[0]}{r.last_name[0]}</AvatarFallback>
                                </Avatar>
                                {r.first_name} {r.last_name}
                             </TableCell>
                             <TableCell>{r.role}</TableCell>
                             <TableCell>{r.project_name}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
         </Table>
      </div>
     </div>
  );
}
