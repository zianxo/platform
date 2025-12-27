"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ParentProjectForm, type ParentProjectFormData } from "@/components/projects/parent-project-form";
import { toast } from "sonner";

function useProjectDetail(id: string) {
    const { data } = useQuery({ queryKey: ["projects", id], queryFn: () => api.projects.get(id) });
    return data;
}

import { Skeleton } from "@/components/ui/skeleton";

function EditProjectSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-32 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const project = useProjectDetail(id);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: ParentProjectFormData) => {
        return api.projects.update(id, data as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
      router.push(`/projects/${id}`);
    },
    onError: () => {
        toast.error("Failed to update project");
    }
  });

  if (!project) return <EditProjectSkeleton />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
            <p className="text-muted-foreground">Adjust project details.</p>
        </div>
      </div>

       <div className="glass-card rounded-xl p-8 border-white/5 shadow-2xl">
          <ParentProjectForm 
             initialData={project} 
             onSubmit={(data) => mutation.mutate(data)} 
             isLoading={mutation.isPending} 
             buttonText="Update Project"
             mode="edit"
          />
       </div>
    </div>
  );
}
