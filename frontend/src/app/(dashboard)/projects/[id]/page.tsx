"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Archive, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Users,
  LayoutGrid,
  FileText,
  MoreHorizontal,
  Edit2,
  Trash2
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { EditAssignmentModal } from "@/components/edit-assignment-modal";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function useProjectDetail(id: string) {
    const { data } = useQuery({ queryKey: ["projects", id], queryFn: () => api.projects.get(id) });
    return data;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ... (keep imports)
import { useEffect, useState } from "react";
import { useClientContext } from "@/components/providers/client-provider";

import { Skeleton } from "@/components/ui/skeleton";

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-2">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
        <Skeleton className="lg:col-span-3 h-64 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const project = useProjectDetail(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeClient } = useClientContext();

  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Queries
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
      queryKey: ["assignments", id],
      queryFn: () => api.projects.assignments.listByProject(id)
  });

  const { data: talent } = useQuery({
      queryKey: ["talent"],
      queryFn: () => api.talent.list()
  });

  const deleteAssignmentMutation = useMutation({
      mutationFn: (assignmentId: string) => api.projects.assignments.delete(assignmentId),
      onSuccess: () => {
          toast.success("Assignment removed");
          queryClient.invalidateQueries({ queryKey: ["projects", id] });
          queryClient.invalidateQueries({ queryKey: ["assignments", id] });
      },
      onError: () => toast.error("Failed to remove assignment")
  });

  useEffect(() => {
      // If active client context changes and doesn't match project, redirect
      if (activeClient && project && project.client_id !== activeClient.id) {
          router.push("/projects");
      }
  }, [activeClient, project, router]);
  
  
  const updateStatusMutation = useMutation({
      mutationFn: (newStatus: string) => api.projects.update(id, { status: newStatus as any }),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["projects", id] });
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          toast.success("Project status updated");
      },
      onError: (err: any) => {
          toast.error(err.message || "Failed to update project status");
      }
  });

  const deleteMutation = useMutation({
      mutationFn: api.projects.delete,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          toast.success("Project deleted successfully");
          router.replace("/projects");
      },
      onError: (err: any) => {
          toast.error(err.message || "Failed to delete project. Ensure all assignments are removed first.");
      }
  });

  if (!project) return <ProjectDetailSkeleton />;

  const activeAssignmentsCount = assignments?.length || 0;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    PLANNED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    ARCHIVED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between px-2">
        <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-card border-border/50" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {project.name}
                    </h1>
                    <Select 
                        value={project.status} 
                        onValueChange={(val) => updateStatusMutation.mutate(val)}
                        disabled={updateStatusMutation.isPending}
                    >
                        <SelectTrigger className={`h-7 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${statusColors[project.status] || ""}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover/90 backdrop-blur-xl border-border">
                            <SelectItem value="ACTIVE" className="text-emerald-500 font-bold focus:bg-emerald-500/10 focus:text-emerald-500">ACTIVE</SelectItem>
                            <SelectItem value="PLANNED" className="text-blue-500 font-bold focus:bg-blue-500/10 focus:text-blue-500">PLANNED</SelectItem>
                            <SelectItem value="ARCHIVED" className="text-slate-500 font-bold focus:bg-slate-500/10 focus:text-slate-500">ARCHIVED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-muted-foreground text-sm font-medium pr-10">{project.description || "No description provided."}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3 flex-none">
             <Link href={`/projects/documents?entityId=${id}`}>
                 <Button variant="outline" size="sm" className="rounded-xl bg-card border-border/50 gap-2">
                    <FileText className="size-4" />
                    Documents
                 </Button>
             </Link>
             
             <Link href={`/projects/${id}/edit`}>
                 <Button variant="outline" size="sm" className="rounded-xl bg-card border-border/50">Edit Project</Button>
             </Link>
             
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-xl shadow-lg shadow-destructive/10" disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-popover/90 backdrop-blur-xl border-border rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            {activeAssignmentsCount > 0 ? (
                                <>
                                    This project has <span className="text-foreground font-bold">{activeAssignmentsCount} active assignment(s)</span>. 
                                    Deleting it will permanently remove the project and all related history.
                                </>
                            ) : (
                                "This will permanently delete the project and remove all associated data from our servers."
                            )}
                            <br /><br />
                            <span className="text-destructive font-semibold">This action cannot be undone.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold">
                            Delete Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
        </div>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm ring-1 ring-border/5 hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Engagement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-muted/20 rounded-xl border border-border/10">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Badge className="h-1 w-1 p-0 rounded-full" /> Engagement
                    </span>
                    <div className="font-bold text-sm truncate">{project.engagement_type?.replace(/_/g, " ") || "Time & Materials"}</div>
                </div>
                <div className="space-y-1 p-3 bg-muted/20 rounded-xl border border-border/10">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Badge className="h-1 w-1 p-0 rounded-full bg-blue-500" /> Target MRR
                    </span>
                    <div className="font-bold text-sm truncate">{project.monthly_budget ? `$${project.monthly_budget.toLocaleString()}` : "—"}</div>
                </div>
                <div className="space-y-1 p-3 bg-muted/20 rounded-xl border border-border/10">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Badge className="h-1 w-1 p-0 rounded-full bg-indigo-500" /> Capacity
                    </span>
                    <div className="font-bold text-sm truncate">{project.target_hours_per_week || "0"} hrs/wk</div>
                </div>
                <div className="space-y-1 p-3 bg-muted/20 rounded-xl border border-border/10">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Badge className="h-1 w-1 p-0 rounded-full bg-slate-500" /> Start Date
                    </span>
                    <div className="font-bold text-sm truncate">{format(new Date(project.created_at), 'MMM d, yyyy')}</div>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Tracking Dashboard */}
        <Card className="lg:col-span-3 border-border/50 bg-card shadow-sm ring-1 ring-border/5 hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Financial Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {(() => {
                    const billableDays = project.billable_days_per_month || 21;
                    const plannedRevenue = project.planned_roles?.reduce((acc: number, r: any) => acc + (r.count * r.bill_rate * billableDays), 0) || 0;
                    
                    const getMonthlyBill = (a: any) => a.daily_bill_rate ? a.daily_bill_rate * billableDays : (a.monthly_client_rate || 0);
                    const getMonthlyCost = (a: any) => a.daily_payout_rate ? a.daily_payout_rate * billableDays : (a.monthly_contractor_cost || 0);

                    const totalActualRevenue = assignments?.reduce((acc: number, a: any) => acc + getMonthlyBill(a), 0) || 0;
                    const totalActualCost = assignments?.reduce((acc: number, a: any) => acc + getMonthlyCost(a), 0) || 0;
                    const totalProfit = totalActualRevenue - totalActualCost;
                    const totalMarginPercent = totalActualRevenue > 0 ? (totalProfit / totalActualRevenue) * 100 : 0;

                    return (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Projected Revenue</span>
                                    <div className="text-2xl font-black text-foreground">${Math.round(plannedRevenue).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Active Revenue</span>
                                    <div className="text-2xl font-black text-foreground">${Math.round(totalActualRevenue).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Net Profit</span>
                                    <div className="text-2xl font-black text-emerald-500">${Math.round(totalProfit).toLocaleString()}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Margin</span>
                                    <div className="text-2xl font-black text-indigo-500">{totalMarginPercent.toFixed(1)}%</div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>Plan Accuracy</span>
                                    <span>{plannedRevenue > 0 ? Math.round((totalActualRevenue / plannedRevenue) * 100) : 0}%</span>
                                </div>
                                <div className="h-4 w-full bg-muted/20 rounded-full p-[4px] border border-border/10 ring-1 ring-inset ring-white/5">
                                    <div className="h-full w-full bg-background/40 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, Math.round((totalActualRevenue / (plannedRevenue || 1)) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </CardContent>
        </Card>
      </div>
      
      <div>
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <Link href={`/projects/${id}/assign`}>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Team Member
                </Button>
            </Link>
         </div>
         
         <div className="rounded-md border bg-card">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Talent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bill Rate</TableHead>
                <TableHead>Pay Rate</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assignments?.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                    No active team members. Assign talent to this project.
                    </TableCell>
                </TableRow>
                ) : (
                assignments?.map((assignment) => {
                    const t = talent?.find(x => x.id === assignment.talent_id);
                    const dailyBill = assignment.daily_bill_rate || 0;
                    const dailyPay = assignment.daily_payout_rate || 0;
                    const margin = dailyBill - dailyPay;
                    const marginPercent = dailyBill > 0 ? (margin / dailyBill) * 100 : 0;

                    return (
                    <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                        {t ? `${t.first_name} ${t.last_name}` : "Unknown"}
                    </TableCell>
                    <TableCell>{assignment.role}</TableCell>
                    <TableCell>${dailyBill > 0 ? `${dailyBill}/day` : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">${dailyPay > 0 ? `${dailyPay}/day` : "-"}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className={margin > 0 ? "text-emerald-600 font-medium" : "text-destructive"}>
                                {marginPercent.toFixed(1)}%
                            </span>
                            <span className="text-xs text-muted-foreground">${margin}/day</span>
                        </div>
                    </TableCell>
                    <TableCell>
                         <Badge variant="outline">{assignment.status}</Badge>
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 glass border-white/5 shadow-2xl rounded-xl p-2">
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 px-3 py-2">Member Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                    className="gap-2 cursor-pointer font-bold rounded-lg"
                                    onClick={() => {
                                        setEditAssignment(assignment);
                                        setIsEditModalOpen(true);
                                    }}
                                >
                                    <Edit2 className="size-4" /> Edit Assignment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    className="gap-2 cursor-pointer font-bold text-destructive focus:bg-destructive/10 rounded-lg"
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to remove ${t?.first_name} from this project?`)) {
                                            deleteAssignmentMutation.mutate(assignment.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="size-4" /> Remove from Project
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )})
                )}
            </TableBody>
            </Table>
        </div>
      </div>

      <EditAssignmentModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        assignment={editAssignment}
        talentName={talent?.find((x: any) => x.id === editAssignment?.talent_id)?.first_name + " " + talent?.find((x: any) => x.id === editAssignment?.talent_id)?.last_name || ""}
      />
    </div>
  );
}
