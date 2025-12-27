"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
        // 1. Create Client
        const client = await api.clients.create({
            company_name: data.company_name,
            country: data.country,
            timezone: data.timezone,
            billing_currency: data.billing_currency,
            status: data.status,
            notes: data.notes
        });

        // 2. Create Primary Contact if provided
        if (data.contact_first_name && data.contact_email) {
            await api.clients.createContact(client.id, {
                first_name: data.contact_first_name || "",
                last_name: data.contact_last_name || "",
                email: data.contact_email || "",
                role: data.contact_role || "Primary Contact",
                is_primary: true
            });
        }
        return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
      router.push("/clients");
    },
    onError: () => {
        toast.error("Failed to create client");
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
          <p className="text-muted-foreground">Onboard a new client company.</p>
        </div>
      </div>

       <ClientForm 
          onSubmit={(data) => mutation.mutate(data)} 
          isLoading={mutation.isPending} 
          mode="create"
       />
    </div>
  );
}
