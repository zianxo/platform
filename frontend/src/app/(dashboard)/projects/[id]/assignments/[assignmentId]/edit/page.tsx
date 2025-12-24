"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AssignmentForm, type AssignmentFormData } from "@/components/projects/assignment-form";
import { toast } from "sonner";

function useAssignment(id: string) {
    const { data } = useQuery({ 
        queryKey: ["assignments", id], 
        queryFn: () => api.projects.assignments.get(id) 
    });
    return data;
}

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const assignment = useAssignment(assignmentId);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AssignmentFormData) => {
         const payload = {
            ...data,
            project_id: projectId,
            hours_per_week: data.hours_per_week ? Number(data.hours_per_week) : undefined,
            daily_payout_rate: data.daily_payout_rate ? Number(data.daily_payout_rate) : undefined,
            daily_bill_rate: data.daily_bill_rate ? Number(data.daily_bill_rate) : undefined,
            monthly_client_rate: data.monthly_client_rate ? Number(data.monthly_client_rate) : undefined,
            monthly_contractor_cost: data.monthly_contractor_cost ? Number(data.monthly_contractor_cost) : undefined,
            start_date: new Date(data.start_date as string).toISOString()
        }
        return api.projects.assignments.update(assignmentId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment updated successfully");
      router.push(`/projects/${projectId}`);
    },
    onError: () => {
        toast.error("Failed to update assignment.");
    }
  });

  if (!assignment) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Assignment</h1>
          <p className="text-muted-foreground">Update team member details.</p>
        </div>
      </div>

       <AssignmentForm 
          projectId={projectId}
          initialData={assignment}
          onSubmit={(data) => mutation.mutate(data)} 
          isLoading={mutation.isPending} 
       />
    </div>
  );
}
