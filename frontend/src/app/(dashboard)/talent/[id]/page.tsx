"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, MapPin, Briefcase, Calendar, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { FileText as FileIcon } from "lucide-react";
import { UploadDocumentModal } from "@/components/upload-document-modal";

function TalentDocuments({ talentId }: { talentId: string }) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { data: docs } = useQuery({ queryKey: ["documents"], queryFn: api.documents.list });
    
    // Client-side filter for real data
    const talentDocs = docs?.filter(d => d.entity_type === 'TALENT' && d.entity_id === talentId);

    return (
        <div className="space-y-4">
            {talentDocs && talentDocs.length > 0 ? (
                <div className="grid gap-2">
                    {talentDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                                    {doc.file_name || "Document"}
                                </a>
                            </div>
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                                {doc.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsUploadModalOpen(true)}>
                Upload Document
            </Button>

            <UploadDocumentModal 
                open={isUploadModalOpen} 
                onOpenChange={setIsUploadModalOpen} 
                defaultType="TALENT"
                defaultEntityId={talentId}
            />
        </div>
    );
}


import { Skeleton } from "@/components/ui/skeleton";

function TalentDetailSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4 px-1">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function TalentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: talent, isLoading: isLoadingTalent } = useQuery({
    queryKey: ["talent", id],
    queryFn: () => api.talent.get(id),
  });

  const { data: allAssignments, isLoading: isLoadingAssignments } = useQuery({ 
      queryKey: ["assignments"], 
      queryFn: api.projects.assignments.list 
  });
  
  const { data: allProjects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });

  // Filter assignments for this talent
  const talentAssignments = allAssignments?.filter(a => a.talent_id === id);

  if (isLoadingTalent || isLoadingAssignments) return <TalentDetailSkeleton />;
  if (!talent) return <div className="p-8">Talent not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {talent.first_name} {talent.last_name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Briefcase className="h-3 w-3" /> {talent.role} ({talent.seniority})
            <span className="mx-1">•</span>
            <MapPin className="h-3 w-3" /> {talent.country || "Remote"}
          </div>
        </div>
        <div className="ml-auto flex gap-2">
            <Link href={`/talent/${id}/edit`}>
                 <Button variant="outline">Edit Profile</Button> 
            </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="md:col-span-2 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-wrap gap-2">
                                {talent.skills && talent.skills.length > 0 ? (
                                    talent.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)
                                ) : (
                                    <span className="text-muted-foreground">No skills listed.</span>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TalentAssignmentsList assignments={talentAssignments} projects={allProjects} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {talent.notes || "No notes available."}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                   <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <Link href={`/projects/new?talent_id=${id}`} className="w-full">
                                <Button className="w-full">Assign to Project</Button>
                            </Link>
                        </CardContent>
                   </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <a href={`mailto:${talent.email}`} className="text-blue-600 hover:underline">{talent.email}</a>
                        </div>
                    </CardContent>
                  </Card>
                   
                   <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline">{talent.source || "Unknown"}</Badge>
                    </CardContent>
                  </Card>
                </div>
            </div>
        </TabsContent>
        
        <TabsContent value="history">
             <Card>
                 <CardHeader>
                     <CardTitle>Activity History</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <TalentHistory history={talent.history || []} assignments={talentAssignments} projects={allProjects} />
                 </CardContent>
             </Card>
        </TabsContent>

        <TabsContent value="documents">
            <Card>
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent>
                     <TalentDocuments talentId={id} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TalentAssignmentsList({ assignments, projects }: { assignments: any[] | undefined, projects: any[] | undefined }) {
    if (!assignments || assignments.length === 0) {
        return <p className="text-muted-foreground text-sm">No active assignments.</p>;
    }

    return (
        <div className="space-y-4">
            {assignments.map(assignment => {
                const project = projects?.find(p => p.id === assignment.project_id);
                return (
                    <div key={assignment.id} className="flex flex-col md:flex-row justify-between p-4 border rounded-lg bg-card/50 hover:bg-muted/20 transition-colors gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{assignment.role}</span>
                                <Badge variant={assignment.status === 'ACTIVE' ? "default" : "secondary"} className="text-[10px] h-5">
                                    {assignment.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-foreground/80 font-medium">
                                <Link href={`/projects/${assignment.project_id}`} className="hover:underline hover:text-primary transition-colors">
                                    {project?.name || "Unknown Project"}
                                </Link>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(assignment.start_date), "MMM d, yyyy")} - {assignment.trial_end_date ? format(new Date(assignment.trial_end_date), "MMM d, yyyy") : "Ongoing"}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end min-w-[120px] text-right">
                             <div className="text-sm">
                                <span className="text-muted-foreground text-xs mr-2">Bill:</span>
                                <span className="font-mono font-medium">
                                    {assignment.daily_bill_rate 
                                        ? `$${assignment.daily_bill_rate}/day`
                                        : (assignment.monthly_client_rate || project?.monthly_budget 
                                            ? `$${(assignment.monthly_client_rate || project?.monthly_budget).toLocaleString()}/mo` 
                                            : "N/A")}
                                </span>
                             </div>
                             <div className="text-sm">
                                <span className="text-muted-foreground text-xs mr-2">Pay:</span>
                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-500">
                                    {assignment.daily_payout_rate
                                        ? `$${assignment.daily_payout_rate}/day`
                                        : `$${assignment.monthly_contractor_cost.toLocaleString()}/mo`}
                                </span>
                             </div>
                             <div className="text-sm">
                                <span className="text-muted-foreground text-xs mr-2">Est. Margin:</span>
                                <span className="font-mono font-medium text-blue-600 dark:text-blue-500">
                                    {(() => {
                                        // Always use monthly for margin as it aggregates better
                                        const rate = assignment.monthly_client_rate || project?.monthly_budget || 0;
                                        const cost = assignment.monthly_contractor_cost || 0;
                                        const margin = rate - cost;
                                        return `$${Math.round(margin).toLocaleString()}/mo`; 
                                    })()}
                                </span>
                             </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TalentHistory({ history, assignments, projects }: { history: any[], assignments: any[] | undefined, projects: any[] | undefined }) {
    // Merge events
    const events = [
        ...(history || []).map(h => ({
            type: 'status',
            date: new Date(h.changed_at),
            label: `Status changed to ${h.status}`,
            details: h.notes
        })),
        ...(assignments || []).map(a => {
            const p = projects?.find(proj => proj.id === a.project_id);
            return {
                type: 'assignment_start',
                date: new Date(a.start_date),
                label: `Assigned to ${p?.name || "Project"} as ${a.role}`,
                details: `Started assignment`
            };
        })
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    if (events.length === 0) return <p className="text-muted-foreground">No history recorded.</p>;

    return (
        <div className="relative border-l border-muted ml-2 space-y-8 py-2">
            {events.map((item, index) => (
                <div key={index} className="ml-6 relative">
                    <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-background ${item.type === 'assignment_start' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{format(item.date, "PPP p")}</span>
                        {item.details && <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-md inline-block">{item.details}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
