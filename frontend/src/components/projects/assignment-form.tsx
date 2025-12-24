"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type ProjectAssignment } from "@/lib/api";
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
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export interface AssignmentFormData extends Partial<ProjectAssignment> {}

interface AssignmentFormProps {
    initialData?: Partial<AssignmentFormData>; 
    projectId: string;
    onSubmit: (data: AssignmentFormData) => void;
    isLoading?: boolean;
    buttonText?: string;
}

export function AssignmentForm({ initialData, projectId, onSubmit, isLoading, buttonText = "Assign Talent" }: AssignmentFormProps) {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<AssignmentFormData>({
      defaultValues: { status: "TRIAL", ...initialData } 
  });

  // Watch for live updates
  const dailyPay = watch("daily_payout_rate");
  const dailyBill = watch("daily_bill_rate");
  
  // Fetch talent
  const { data: talent } = useQuery({ queryKey: ["talent"], queryFn: api.talent.list });

  // Fetch project details for validation & Planned Roles
  const { data: project } = useQuery({ 
    queryKey: ["project", projectId], 
    queryFn: () => api.projects.get(projectId),
    enabled: !!projectId
  });
  
  const billableDays = project?.billable_days_per_month || 21;
  const plannedRoles = project?.planned_roles || [];

  // Fetch existing assignments to calculate remaining budget/hours
  const { data: assignments } = useQuery({ 
      queryKey: ["assignments"], 
      queryFn: api.projects.assignments.list 
  });

  const projectAssignments = assignments?.filter(a => a.project_id === projectId) || [];
  
  // Calculate usage base (excluding current assignment if editing)
  const currentAssignmentId = initialData?.id;
  const otherAssignments = currentAssignmentId 
        ? projectAssignments.filter(a => a.id !== currentAssignmentId)
        : projectAssignments;

  const usedBudgetBase = otherAssignments.reduce((sum, a) => sum + (a.monthly_contractor_cost || 0), 0);
  const usedHoursBase = otherAssignments.reduce((sum, a) => sum + (a.hours_per_week || 0), 0);

  const roleCounts = otherAssignments.reduce((acc, a) => {
      const r = a.role || "";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const budgetCap = (project?.monthly_budget || 0) - usedBudgetBase;
  const hoursCap = (project?.target_hours_per_week || 0) - usedHoursBase;
  
  // Dynamic remaining values based on current input
  const estMonthlyCost = (Number(dailyPay) || 0) * billableDays;
  const liveRemainingBudget = budgetCap - estMonthlyCost;
  
  // Max Daily Rate derived from remaining Monthly Budget
  const maxDailyRate = budgetCap > 0 ? Math.floor(budgetCap / billableDays) : 0;

  useEffect(() => {
    if (initialData) {
        // Logic to withstand legacy data (convert monthly to daily if daily is missing)
        // using fixed 21.73 here as fallback for legacy data conversion safety
        const conversionFactor = 21.73; 
        const safeDailyPay = initialData.daily_payout_rate ?? (initialData.monthly_contractor_cost ? Number((initialData.monthly_contractor_cost / conversionFactor).toFixed(2)) : undefined);
        const safeDailyBill = initialData.daily_bill_rate ?? (initialData.monthly_client_rate ? Number((initialData.monthly_client_rate / conversionFactor).toFixed(2)) : undefined);

        reset({
            ...initialData,
            daily_payout_rate: safeDailyPay,
            daily_bill_rate: safeDailyBill,
            start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : undefined,
            status: initialData.status || "TRIAL"
        });
    }
  }, [initialData, reset]);

  // Auto-fill logic when project data loads
  useEffect(() => {
    if (project && !initialData) {
        if (hoursCap > 0) {
             setValue("hours_per_week", hoursCap);
        } else if (project.target_hours_per_week) {
             setValue("hours_per_week", project.target_hours_per_week);
        }
    }
  }, [project, initialData, setValue, hoursCap]);

  // Warning for Negative Margin
  const margin = (Number(dailyBill) || 0) - (Number(dailyPay) || 0);
  const isNegativeMargin = margin < 0 && dailyBill && dailyPay;


  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("project_id")} value={projectId} />

          {/* Role Selection - Strict Enforcement */}
          <div className="space-y-2">
             <Label htmlFor="role">Role on Project {plannedRoles.length > 0 && "*"}</Label>
             {plannedRoles.length > 0 ? (
                 <Select 
                    onValueChange={(roleName) => {
                        setValue("role", roleName);
                        // Auto-set Bill Rate
                        const role = plannedRoles.find(r => r.role_name === roleName);
                        if (role) {
                            setValue("daily_bill_rate", role.bill_rate);
                        }
                    }} 
                    defaultValue={initialData?.role}
                 >
                     <SelectTrigger>
                         <SelectValue placeholder="Select a Planned Role" />
                     </SelectTrigger>
                     <SelectContent>
                         {plannedRoles.map((r, i) => {
                             const used = roleCounts[r.role_name] || 0;
                             const isFull = used >= r.count;
                             return (
                                 <SelectItem key={i} value={r.role_name} disabled={isFull}>
                                     <div className="flex justify-between w-[240px] items-center">
                                         <span>{r.role_name}</span>
                                         <span className="text-muted-foreground font-mono text-xs ml-2">
                                             {used}/{r.count}{isFull ? " (Full)" : ""}
                                         </span>
                                     </div>
                                 </SelectItem>
                             )
                         })}
                     </SelectContent>
                 </Select>
             ) : (
                <Input id="role" {...register("role", { required: true })} placeholder="e.g. Lead Backend Engineer" />
             )}
             {plannedRoles.length > 0 && (
                 <p className="text-[10px] text-muted-foreground">Must match a role defined in the project blueprint.</p>
             )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="talent_id">Talent</Label>
            <Select 
                onValueChange={(v) => setValue("talent_id", v)} 
                defaultValue={initialData?.talent_id}
                disabled={plannedRoles.length > 0 && !watch("role")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Talent" />
              </SelectTrigger>
              <SelectContent>
                {talent?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {plannedRoles.length > 0 && !watch("role") && (
                <p className="text-[10px] text-muted-foreground">Select a vacancy (role) first.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <div className="flex justify-between">
                    <Label htmlFor="hours_per_week">Hours Per Week</Label>
                    <span className="text-xs text-muted-foreground">
                        {hoursCap > 0 ? `${hoursCap}h available` : `${usedHoursBase}h used`}
                    </span>
                </div>
                <Input 
                    id="hours_per_week" 
                    type="number" 
                    {...register("hours_per_week", {
                        validate: (value) => {
                            // Relaxed validation
                            return true;
                        }
                    })} 
                    placeholder="40" 
                />
             </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(v) => setValue("status", v as any)} defaultValue={initialData?.status || "TRIAL"}>
                  <SelectTrigger>
                    <SelectValue placeholder={initialData?.status || "TRIAL"} />
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
               <Label htmlFor="start_date">Start Date</Label>
               <Input id="start_date" type="date" {...register("start_date", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label htmlFor="daily_payout_rate">Daily Pay Rate ($)</Label>
                 <div className="flex gap-2 items-center">
                    <span className={`text-xs ${liveRemainingBudget < 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        {project ? `Limit: $${maxDailyRate} ($${budgetCap.toLocaleString()}/mo)` : "..."}
                    </span>
                    {maxDailyRate > 0 && (
                        <button 
                            type="button"
                            onClick={() => setValue("daily_payout_rate", maxDailyRate)}
                            className="text-[10px] bg-secondary hover:bg-secondary/80 px-1.5 py-0.5 rounded text-secondary-foreground transition-colors"
                        >
                            Max
                        </button>
                    )}
                 </div>
              </div>
              
              <Input 
                id="daily_payout_rate" 
                type="number" 
                step="0.01"
                {...register("daily_payout_rate", { 
                    required: true,
                    validate: (value) => true
                })} 
                placeholder="300" 
             />
             <p className="text-[10px] text-muted-foreground">Est. Cost: ${Math.round((Number(dailyPay) || 0) * billableDays).toLocaleString()}/mo</p>
            </div>

            <div className="space-y-2">
               <Label htmlFor="daily_bill_rate">Daily Bill Rate ($)</Label>
               <Input 
                   id="daily_bill_rate" 
                   type="number"
                   step="0.01" 
                   readOnly={plannedRoles.length > 0}
                   className={plannedRoles.length > 0 ? "bg-muted font-medium cursor-not-allowed" : ""}
                   {...register("daily_bill_rate")} 
                   placeholder="e.g. 500" 
               />
               <p className="text-[10px] text-muted-foreground">Est. Rev: ${Math.round((Number(dailyBill) || 0) * billableDays).toLocaleString()}/mo</p>
            </div>
          </div>

          {/* Negative Margin Warning */}
          {isNegativeMargin && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertTriangle className="h-5 w-5" />
                  <div className="text-sm font-medium">
                      Warning: Negative Margin (-${Math.abs(margin).toFixed(2)}/day). Assignment is at a loss.
                  </div>
              </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : buttonText}
            </Button>
          </div>
        </form>
      </div>
  );
}
