"use client";

export const dynamic = 'force-dynamic';

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { Suspense } from 'react';

function NewContractPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue } = useForm();

  // Pre-fill from URL if available
  const preClientId = searchParams.get("client_id");
  const preTalentId = searchParams.get("talent_id"); // If we came from Talent page

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
  const { data: talentList } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });
  
  // Use Assignments for linking contracts, not Parent Projects directly
  const { data: assignments } = useQuery({ queryKey: ["assignments"], queryFn: api.projects.assignments.list });
  const { data: parentProjects } = useQuery({ queryKey: ["projects"], queryFn: api.projects.list });

  const mutation = useMutation({
    mutationFn: api.contracts.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract created successfully");
      router.push("/contracts");
    },
    onError: () => {
        toast.error("Failed to create contract");
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
        ...data,
        // Ensure dates are ISO strings? Backend expects Time.
        start_date: new Date(data.start_date).toISOString(),
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        notice_period_days: parseInt(data.notice_period_days || "30"),
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contracts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Contract</h1>
          <p className="text-muted-foreground">Create a new legal agreement.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select onValueChange={(v) => setValue("type", v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MSA">MSA (Master Service Agreement)</SelectItem>
                                <SelectItem value="SOW">SOW (Statement of Work)</SelectItem>
                                <SelectItem value="NDA">NDA (Non-Disclosure)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Status</Label>
                        <Select onValueChange={(v) => setValue("status", v)} defaultValue="DRAFT">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="SENT">Sent</SelectItem>
                                <SelectItem value="SIGNED">Signed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Client</Label>
                    <Select onValueChange={(v) => setValue("client_id", v)} defaultValue={preClientId || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Talent (Optional for MSA)</Label>
                     <Select onValueChange={(v) => setValue("talent_id", v)} defaultValue={preTalentId || undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Talent" />
                        </SelectTrigger>
                        <SelectContent>
                            {talentList?.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 <div className="space-y-2">
                    <Label>Assignment (Optional)</Label>
                     <Select onValueChange={(v) => setValue("project_id", v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Assignment" />
                        </SelectTrigger>
                        <SelectContent>
                            {assignments?.map((a) => {
                                const projName = parentProjects?.find(p => p.id === a.project_id)?.name || "Unknown Project";
                                return (
                                   <SelectItem key={a.id} value={a.id}>{a.role} at {projName}</SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" {...register("start_date", { required: true })} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Input type="date" {...register("end_date")} />
                    </div>
                </div>
                
                 <div className="space-y-2">
                    <Label>Notice Period (Days)</Label>
                    <Input type="number" {...register("notice_period_days")} placeholder="30" />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={mutation.isPending}>Create Contract</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewContractPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewContractPageContent />
        </Suspense>
    )
}
