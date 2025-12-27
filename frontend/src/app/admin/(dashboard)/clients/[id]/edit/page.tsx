"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type Client } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { toast } from "sonner";

// Helper since backend get(id) is not widely available, or we use list logic
// Using api.clients.list and filtering for now, but update relies on id
function useClientDetail(id: string) {
    const { data } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
    return data?.find(t => t.id === id);
}

import { Skeleton } from "@/components/ui/skeleton";

function EditClientSkeleton() {
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

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const client = useClientDetail(id);

  const mutation = useMutation({
    mutationFn: (data: ClientFormData) => api.clients.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated successfully");
      router.push(`/clients/${id}`);
    },
    onError: () => {
        toast.error("Failed to update client.");
    }
  });

  if (!client) return <EditClientSkeleton />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
          <p className="text-muted-foreground">Update company information.</p>
        </div>
      </div>

       <ClientForm 
          initialData={client} 
          onSubmit={(data) => mutation.mutate(data)} 
          isLoading={mutation.isPending} 
          buttonText="Update Client"
          mode="edit"
       />
    </div>
  );
}
