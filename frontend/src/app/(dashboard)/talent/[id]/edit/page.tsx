"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type Talent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TalentForm } from "@/components/talent/talent-form";
import { toast } from "sonner"; // If you have sonner or similar, otherwise use alert

import { Skeleton } from "@/components/ui/skeleton";

function EditTalentSkeleton() {
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

export default function EditTalentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: talent, isLoading: isLoadingTalent } = useQuery({
    queryKey: ["talent", id],
    queryFn: () => api.talent.get(id),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Talent>) => api.talent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent"] });
      queryClient.invalidateQueries({ queryKey: ["talent", id] });
      toast.success("Talent updated successfully");
      router.push(`/talent/${id}`);
    },
    onError: () => {
        toast.error("Failed to update talent.");
    }
  });

  if (isLoadingTalent) return <EditTalentSkeleton />;
  if (!talent) return <div className="p-8">Talent not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Talent</h1>
          <p className="text-muted-foreground">Update candidate information.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-8 border-white/5 shadow-2xl">
          <TalentForm 
            initialData={talent} 
            onSubmit={(data) => mutation.mutate(data)} 
            isLoading={mutation.isPending} 
            buttonText="Update Talent"
          />
      </div>
    </div>
  );
}
