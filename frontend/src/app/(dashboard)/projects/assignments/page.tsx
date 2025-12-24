"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAssignment } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ProjectAssignmentsPage() {
    // Re-using the same API as Talent Assignments, but framed for Projects context
    // Ideally this might filter differently or show different columns (like Cost/Revenue) if user had permissions.
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: api.projects.assignments.list,
  });

  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });
  const { data: talent } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });

  if (isLoading) {
    return <div className="p-8">Loading assignments...</div>;
  }

  const getProjectName = (id: string) => projects?.find(p => p.id === id)?.name || "Unknown Project";
  const getTalentName = (id: string) => {
      const t = talent?.find(t => t.id === id);
      return t ? `${t.first_name} ${t.last_name}` : "Unknown Talent";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
            Active Assignments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage ongoing project allocations.</p>
        </div>
      </div>

       <div className="rounded-xl border border-border/50 bg-card shadow-sm ring-1 ring-border/5 overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Talent</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Week Hours</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assignments?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">No assignments found.</TableCell>
                    </TableRow>
                ) : (
                    assignments?.map((a: ProjectAssignment) => (
                        <TableRow key={a.id}>
                            <TableCell className="font-medium">{getProjectName(a.project_id)}</TableCell>
                            <TableCell>{getTalentName(a.talent_id)}</TableCell>
                            <TableCell>{a.role}</TableCell>
                            <TableCell>{a.hours_per_week || "-"}</TableCell>
                            <TableCell>
                                <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'}>{a.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
