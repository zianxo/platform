"use client";

export const dynamic = 'force-dynamic';

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ParentProjectForm, type ParentProjectFormData } from "@/components/projects/parent-project-form";
import { useClientContext } from "@/components/providers/client-provider";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignmentForm } from "@/components/projects/assignment-form";
import { toast } from "sonner";

import { Suspense } from 'react';

function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const talentId = searchParams.get("talent_id");
  const queryClient = useQueryClient();
  const { activeClient } = useClientContext();

  // State for Assignment Flow
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Queries
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list }); // Parent projects
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
  const { data: talent } = useQuery({ queryKey: ["talent", talentId], queryFn: () => talentId ? api.talent.get(talentId) : null, enabled: !!talentId });

  // Filter projects by active client if set
  const clientProjects = activeClient 
      ? projects?.filter(p => p.client_id === activeClient.id) 
      : projects;

  const mutationCreateProject = useMutation({
    mutationFn: api.projects.create,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      
      if (!talentId) {
          router.push(`/projects/${newProject.id}`);
          return;
      }

      setSelectedProjectId(newProject.id); // Auto-select new project
      setIsCreatingProject(false); // Go back to assignment flow
    },
    onError: () => {
        toast.error("Failed to create project");
    }
  });

  const mutationAssign = useMutation({
    mutationFn: api.projects.assignments.create,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
        toast.success("Talent assigned successfully");
        // Redirect to the project we just assigned to
        router.push(`/projects/${selectedProjectId}`);
    },
    onError: () => {
        toast.error("Failed to assign talent");
    }
  });

  // Regular Create Project Flow (No Talent)
  if (!talentId) {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
            <p className="text-muted-foreground">Start a new initiative for a client.</p>
            </div>
        </div>

        <ParentProjectForm 
            initialData={activeClient ? { client_id: activeClient.id } : undefined}
            onSubmit={(data) => mutationCreateProject.mutate(data as any)} 
            isLoading={mutationCreateProject.isPending} 
        />
        </div>
    );
  }

  // Assign Talent Flow
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
             Assign {talent ? `${talent.first_name} ${talent.last_name}` : "Talent"}
          </h1>
          <p className="text-muted-foreground">
             Select a project to assign this talent to.
          </p>
        </div>
      </div>

      {/* Step 1: Select or Create Project */}
      {!selectedProjectId && !isCreatingProject && (
          <div className="space-y-6 border p-6 rounded-md bg-card">
               <div className="space-y-2">
                   <Label>Select Existing Project</Label>
                   <Select onValueChange={setSelectedProjectId}>
                       <SelectTrigger>
                           <SelectValue placeholder="Select a Project" />
                       </SelectTrigger>
                       <SelectContent>
                           {clientProjects?.length === 0 ? (
                               <SelectItem value="none" disabled>No projects found for this client</SelectItem>
                           ) : (
                               clientProjects?.map(p => (
                                   <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                               ))
                           )}
                       </SelectContent>
                   </Select>
               </div>

               <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setIsCreatingProject(true)}>
                    Create New Project
                </Button>
          </div>
      )}

      {/* Step 1.5: Create Project Inline */}
      {isCreatingProject && (
           <div className="space-y-4 border p-6 rounded-md bg-card">
               <div className="flex justify-between items-center">
                   <h3 className="font-semibold">Create Project</h3>
                   <Button variant="ghost" size="sm" onClick={() => setIsCreatingProject(false)}>Cancel</Button>
               </div>
               <ParentProjectForm
                    initialData={activeClient ? { client_id: activeClient.id } : undefined}
                    onSubmit={(data) => mutationCreateProject.mutate(data as any)}
                    isLoading={mutationCreateProject.isPending}
                    buttonText="Create & Select"
               />
           </div>
      )}

      {/* Step 2: Assign Form */}
      {selectedProjectId && (
          <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
                   <div>
                       <span className="text-sm font-medium">Selected Project: </span>
                       <span className="font-bold">{projects?.find(p => p.id === selectedProjectId)?.name}</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => setSelectedProjectId(null)}>Change</Button>
               </div>

               <AssignmentForm
                   projectId={selectedProjectId}
                   initialData={{ talent_id: talentId }}
                   onSubmit={(data) => {
                       // Ensure numbers are numbers
                       mutationAssign.mutate({
                           ...data,
                           project_id: selectedProjectId,
                           hours_per_week: data.hours_per_week ? Number(data.hours_per_week) : undefined,
                           monthly_client_rate: Number(data.monthly_client_rate),
                           monthly_contractor_cost: Number(data.monthly_contractor_cost),
                           start_date: new Date(data.start_date as string).toISOString()
                       })
                   }}
                   isLoading={mutationAssign.isPending}
               />
          </div>
      )}

    </div>
  )
}

export default function NewProjectPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewProjectPageContent />
        </Suspense>
    )
}
