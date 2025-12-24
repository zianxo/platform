
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface EditAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  talentName: string;
}

export function EditAssignmentModal({ open, onOpenChange, assignment, talentName }: EditAssignmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    role: "",
    dailyBillRate: "",
    dailyPayoutRate: "",
    hoursPerWeek: "",
    status: "",
    startDate: ""
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        role: assignment.role || "",
        dailyBillRate: assignment.daily_bill_rate?.toString() || "",
        dailyPayoutRate: assignment.daily_payout_rate?.toString() || "",
        hoursPerWeek: assignment.hours_per_week?.toString() || "40",
        status: (assignment.status as any) || "ACTIVE",
        startDate: (assignment.start_date ? new Date(assignment.start_date as string).toISOString().split('T')[0] : "") as string
      });
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.projects.assignments.update(assignment.id, {
        ...assignment,
        role: formData.role,
        daily_bill_rate: parseFloat(formData.dailyBillRate),
        daily_payout_rate: parseFloat(formData.dailyPayoutRate),
        hours_per_week: parseInt(formData.hoursPerWeek),
        status: formData.status,
        start_date: new Date(formData.startDate).toISOString()
      });
      
      toast.success("Assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["projects", assignment.project_id] });
      queryClient.invalidateQueries({ queryKey: ["assignments", assignment.project_id] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass border-white/5 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Assignment: {talentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role / Job Title</Label>
            <Input 
              id="role" 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyBillRate">Daily Bill Rate ($)</Label>
              <Input 
                id="dailyBillRate" 
                type="number"
                value={formData.dailyBillRate}
                onChange={(e) => setFormData({...formData, dailyBillRate: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyPayoutRate">Daily Payout ($)</Label>
              <Input 
                id="dailyPayoutRate" 
                type="number"
                value={formData.dailyPayoutRate}
                onChange={(e) => setFormData({...formData, dailyPayoutRate: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours Per Week</Label>
              <Input 
                id="hoursPerWeek" 
                type="number"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({...formData, hoursPerWeek: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                <SelectTrigger id="status" className="rounded-xl">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ENDED">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
             <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
               Save Changes
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
