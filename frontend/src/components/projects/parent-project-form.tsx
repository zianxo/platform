"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ParentProject } from "@/lib/api";
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
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calculator } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

export interface ParentProjectFormData extends Omit<Partial<ParentProject>, 'planned_roles'> {
    planned_roles?: {
        role_name: string;
        count: number;
        bill_rate: number;
    }[];
}

interface ParentProjectFormProps {
    initialData?: Partial<ParentProject>;
    onSubmit: (data: ParentProjectFormData) => void;
    isLoading?: boolean;
    buttonText?: string;
    mode?: 'create' | 'edit';
}

export function ParentProjectForm({ initialData, onSubmit, isLoading, buttonText = "Save Project", mode = 'create' }: ParentProjectFormProps) {
  const { user } = useAuth();
  const { register, control, handleSubmit, setValue, reset, watch } = useForm<ParentProjectFormData>({
      defaultValues: {
          engagement_type: "TIME_AND_MATERIALS",
          status: "ACTIVE",
          billable_days_per_month: 21,
          planned_roles: [{ role_name: "Senior Developer", count: 1, bill_rate: 500 }],
          ...initialData
      }
  });

  const { fields, append, remove } = useFieldArray({
      control,
      name: "planned_roles"
  });

  const engagementType = watch("engagement_type");
  const clientId = watch("client_id");
  const billableDays = watch("billable_days_per_month") || 21;
  const watchedRoles = watch("planned_roles");

  // Fetch clients
  const { data: clients } = useQuery({ 
      queryKey: ["clients"], 
      queryFn: api.clients.list,
      enabled: !!user 
  });

  useEffect(() => {
    if (initialData) {
        reset({
          engagement_type: "TIME_AND_MATERIALS",
          status: "ACTIVE",
          billable_days_per_month: 21,
          ...initialData
        });
    }
  }, [initialData, reset]);

  // Auto-calculate Budget & Capacity
  const calculatedRevenue = watchedRoles?.reduce((acc, role) => acc + (Number(role.count || 0) * Number(role.bill_rate || 0) * Number(billableDays)), 0) || 0;
  const calculatedHours = watchedRoles?.reduce((acc, role) => acc + (Number(role.count || 0) * 40), 0) || 0;

  // Sync calculated values if T&M
  useEffect(() => {
      if (engagementType === 'TIME_AND_MATERIALS') {
          setValue("monthly_budget", calculatedRevenue);
          setValue("target_hours_per_week", calculatedHours);
      }
  }, [calculatedRevenue, calculatedHours, engagementType, setValue]);


  return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client & Basic Info */}
          <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select 
                    onValueChange={(v) => setValue("client_id", v)} 
                    value={clientId} 
                    disabled={mode === 'edit' || (mode === 'create' && !!initialData?.client_id)}
                >
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
                 <Label htmlFor="name">Project Name</Label>
                 <Input id="name" {...register("name", { required: true })} placeholder="e.g. Mobile App MVP" />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="description">Description (SOW)</Label>
                 <Textarea id="description" {...register("description")} placeholder="Project goals and scope..." />
              </div>
          </div>

          {/* Engagement Config */}
          <div className="p-4 border rounded-md bg-muted/20 space-y-4">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Engagement Configuration
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engagement_type">Type</Label>
                    <Select onValueChange={(v) => setValue("engagement_type", v as any)} defaultValue={initialData?.engagement_type || "TIME_AND_MATERIALS"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Time & Materials" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TIME_AND_MATERIALS">Time & Materials (Staff Aug)</SelectItem>
                            <SelectItem value="FIXED">Fixed Price (Retainer/Project)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billable_days_per_month">Billable Days / Month</Label>
                    <Input 
                        id="billable_days_per_month" 
                        type="number" 
                        {...register("billable_days_per_month", { valueAsNumber: true })} 
                        placeholder="21"
                    />
                  </div>
              </div>

              {/* Dynamic Roles Section (Only for T&M) */}
              {engagementType === 'TIME_AND_MATERIALS' && (
                  <div className="space-y-3">
                      <Label>Planned Team Blueprint</Label>
                      <div className="space-y-2">
                          {fields.map((field, index) => (
                              <div key={field.id} className="flex gap-2 items-start">
                                  <div className="flex-1">
                                      <Input {...register(`planned_roles.${index}.role_name` as const, { required: true })} placeholder="Role (e.g. Sr DevOps)" />
                                  </div>
                                  <div className="w-20">
                                      <Input type="number" {...register(`planned_roles.${index}.count` as const, { valueAsNumber: true })} placeholder="Qty" />
                                  </div>
                                  <div className="w-32">
                                      <Input type="number" {...register(`planned_roles.${index}.bill_rate` as const, { valueAsNumber: true })} placeholder="Rate ($/day)" />
                                  </div>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </Button>
                              </div>
                          ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ role_name: "", count: 1, bill_rate: 0 })}>
                          <Plus className="h-4 w-4 mr-2" /> Add Role
                      </Button>
                  </div>
              )}

              {/* Summary / Calculation Results */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_budget" className="text-muted-foreground">
                        {engagementType === 'FIXED' ? "Total Project Value ($)" : "Proj. Monthly Revenue ($)"}
                    </Label>
                    <Input 
                        id="monthly_budget" 
                        type="number" 
                        readOnly={engagementType === 'TIME_AND_MATERIALS'}
                        className={engagementType === 'TIME_AND_MATERIALS' ? "bg-muted font-mono font-bold" : ""}
                        {...register("monthly_budget", { valueAsNumber: true })} 
                        placeholder={engagementType === 'FIXED' ? "Enter Amount" : "Calculated..."} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_hours_per_week" className="text-muted-foreground">
                        {engagementType === 'FIXED' ? "Target Hours" : "Est. Weekly Capacity (Hours)"}
                    </Label>
                    <Input 
                        id="target_hours_per_week" 
                        type="number" 
                        readOnly={engagementType === 'TIME_AND_MATERIALS'}
                        className={engagementType === 'TIME_AND_MATERIALS' ? "bg-muted font-mono" : ""}
                        {...register("target_hours_per_week", { valueAsNumber: true })} 
                        placeholder="Calculated..." 
                    />
                  </div>
              </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : buttonText}
            </Button>
          </div>
        </form>
  );
}
