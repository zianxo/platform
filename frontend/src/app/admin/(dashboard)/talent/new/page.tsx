"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Talent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TalentForm } from "@/components/talent/talent-form";
import { toast } from "sonner";

export default function NewTalentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();


  const mutation = useMutation({
    mutationFn: api.talent.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent"] });
      toast.success("Talent created successfully");
      router.push("/talent");
    },
    onError: () => {
        toast.error("Failed to create talent");
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/talent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Talent</h1>
          <p className="text-muted-foreground">Add a new candidate to the pool.</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
         <TalentForm 
            onSubmit={(data) => mutation.mutate(data)} 
            isLoading={mutation.isPending} 
        />
      </div>
    </div>
  );
}
