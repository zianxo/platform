"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Budget } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function BudgetsPage() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { data: budgets, isLoading } = useQuery({ queryKey: ["finance", "budgets"], queryFn: api.finance.budgets.list });
    
    const { register, handleSubmit, reset } = useForm<Budget>();
    
    const onSubmit = async (data: any) => {
        try {
            await api.finance.budgets.create({ ...data, total_amount: Number(data.total_amount) });
            queryClient.invalidateQueries({ queryKey: ["finance", "budgets"] });
            toast.success("Budget created");
            setOpen(false);
            reset();
        } catch(e) { toast.error("Failed"); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-black">Budgets</h1>
                 <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl font-bold"><Plus className="mr-2 size-4"/> New Budget</Button></DialogTrigger>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Budget Name</Label><Input {...register("name")} placeholder="Q1 Marketing" required /></div>
                            <div className="space-y-2"><Label>Total Amount</Label><Input type="number" step="0.01" {...register("total_amount")} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Start Date</Label><Input type="date" {...register("start_date")} required /></div>
                                <div className="space-y-2"><Label>End Date</Label><Input type="date" {...register("end_date")} required /></div>
                            </div>
                            <DialogFooter><Button type="submit" className="w-full rounded-xl font-bold">Create</Button></DialogFooter>
                        </form>
                    </DialogContent>
                 </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgets?.map(b => {
                    const progress = b.total_amount > 0 ? ((b.spent_amount || 0) / b.total_amount) * 100 : 0;
                    return (
                    <Card key={b.id} className="rounded-2xl border-border bg-card hover:bg-muted/10 transition-colors">
                        <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold">{b.name}</CardTitle>
                                    <CardDescription className="text-xs font-semibold uppercase tracking-wider">{b.start_date} - {b.end_date}</CardDescription>
                                </div>
                                <PiggyBank className="size-5 text-amber-500" />
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Spent: ${(b.spent_amount || 0).toLocaleString()}</span>
                                <span className="text-muted-foreground">Total: ${b.total_amount.toLocaleString()}</span>
                            </div>
                            <div className="space-y-1">
                                <Progress value={progress} className="h-3 rounded-full" />
                                <div className="flex justify-end text-[10px] font-bold text-muted-foreground">{progress.toFixed(1)}% Used</div>
                            </div>
                        </CardContent>
                    </Card>
                )})}
            </div>
        </div>
    )
}
