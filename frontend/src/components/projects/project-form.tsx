"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Project } from "@/lib/api";
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
import { useEffect } from "react";

export interface ProjectFormData extends Partial<Project> {}

interface ProjectFormProps {
    initialData?: Partial<Project>;
    onSubmit: (data: ProjectFormData) => void;
    isLoading?: boolean;
    buttonText?: string;
    mode?: 'create' | 'edit';
}

export function ProjectForm({ initialData, onSubmit, isLoading, buttonText = "Save Project", mode = 'create' }: ProjectFormProps) {
  const { register, handleSubmit, setValue, reset } = useForm<ProjectFormData>({
      defaultValues: initialData
  });

  // Fetch clients and talent for dropdowns
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
  const { data: talent } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });

  useEffect(() => {
    if (initialData) {
        reset(initialData);
        // Dates need special handling for input type=date if generic string
        if (initialData.start_date) {
            setValue("start_date", new Date(initialData.start_date).toISOString().split('T')[0]);
        }
    }
  }, [initialData, reset, setValue]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select onValueChange={(v) => setValue("client_id", v)} defaultValue={initialData?.client_id} disabled={mode==='edit'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="talent_id">Talent</Label>
              <Select onValueChange={(v) => setValue("talent_id", v)} defaultValue={initialData?.talent_id} disabled={mode==='edit'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Talent" />
                </SelectTrigger>
                <SelectContent>
                  {talent?.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
             <Label htmlFor="role">Role Title</Label>
             <Input id="role" {...register("role", { required: true })} placeholder="Senior React Developer" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="date" {...register("start_date", { required: true })} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(v) => setValue("status", v)} defaultValue={initialData?.status || "TRIAL"}>
                <SelectTrigger>
                  <SelectValue placeholder="TRIAL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ENDING">Ending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_client_rate">Client Rate ($)</Label>
              <Input id="monthly_client_rate" type="number" {...register("monthly_client_rate", { required: true })} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_contractor_cost">Contractor Cost ($)</Label>
              <Input id="monthly_contractor_cost" type="number" {...register("monthly_contractor_cost", { required: true })} placeholder="3000" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : buttonText}
            </Button>
          </div>
        </form>
      </div>
  );
}
