"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AssignmentForm, type AssignmentFormData } from "@/components/projects/assignment-form";
import { toast } from "sonner";

export default function AssignTalentPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: api.projects.assignments.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Talent assigned successfully");
      router.push(`/projects/${projectId}`);
    },
    onError: () => {
        toast.error("Failed to assign talent");
    }
  });

  const onSubmit = (data: AssignmentFormData) => {
    // Convert strings to floats for rates
    const payload = {
        ...data,
        project_id: projectId, // Ensure project ID is captured
        hours_per_week: data.hours_per_week ? Number(data.hours_per_week) : undefined,
        daily_payout_rate: data.daily_payout_rate ? Number(data.daily_payout_rate) : undefined,
        daily_bill_rate: data.daily_bill_rate ? Number(data.daily_bill_rate) : undefined,
        monthly_client_rate: data.monthly_client_rate ? Number(data.monthly_client_rate) : undefined,
        monthly_contractor_cost: data.monthly_contractor_cost ? Number(data.monthly_contractor_cost) : undefined,
        start_date: new Date(data.start_date as string).toISOString()
    }
    mutation.mutate(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Team Member</h1>
          <p className="text-muted-foreground">Assign talent to this project.</p>
        </div>
      </div>

       <AssignmentForm 
          projectId={projectId}
          onSubmit={onSubmit} 
          isLoading={mutation.isPending} 
       />
    </div>
  );
}
