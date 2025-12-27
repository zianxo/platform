"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Expense } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { data: expenses, isLoading } = useQuery({ queryKey: ["finance", "expenses"], queryFn: api.finance.expenses.list });
    const { data: budgets } = useQuery({ queryKey: ["finance", "budgets"], queryFn: api.finance.budgets.list });
    
    const { register, handleSubmit, reset, setValue } = useForm<Expense>();
    
    const onSubmit = async (data: any) => {
        try {
            await api.finance.expenses.create({ ...data, amount: Number(data.amount) });
            queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
            toast.success("Expense recorded");
            setOpen(false);
            reset();
        } catch(e) { toast.error("Failed"); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-black">Expenses</h1>
                 <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl font-bold"><Plus className="mr-2 size-4"/> Record Expense</Button></DialogTrigger>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>Record New Expense</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Description</Label><Input {...register("description")} placeholder="e.g. Server Cost" required /></div>
                            <div className="space-y-2"><Label>Category</Label><Input {...register("category")} placeholder="Software" required /></div>
                            <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" {...register("amount")} required /></div>
                            <div className="space-y-2"><Label>Date</Label><Input type="date" {...register("date")} required /></div>
                            
                            <div className="space-y-2">
                                <Label>Budget (Optional)</Label>
                                <Select onValueChange={(val) => setValue("budget_id", val)}>
                                    <SelectTrigger><SelectValue placeholder="Select Budget" /></SelectTrigger>
                                    <SelectContent>
                                        {budgets?.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter><Button type="submit" className="w-full rounded-xl font-bold">Save</Button></DialogFooter>
                        </form>
                    </DialogContent>
                 </Dialog>
            </div>
            
            <div className="border rounded-2xl overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses?.map(e => (
                            <TableRow key={e.id}>
                                <TableCell>{e.date}</TableCell>
                                <TableCell className="font-medium">{e.description}</TableCell>
                                <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{e.category}</span></TableCell>
                                <TableCell className="text-right font-bold">-${e.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
