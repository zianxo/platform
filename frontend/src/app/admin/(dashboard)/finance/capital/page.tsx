"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function CapitalPage() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { data: capital, isLoading } = useQuery({ queryKey: ["finance", "capital"], queryFn: api.finance.capital.list });
    
    const { register, handleSubmit, reset } = useForm<{ name: string; balance: number; currency: string }>();
    
    const onSubmit = async (data: any) => {
        try {
            await api.finance.capital.create({ ...data, balance: Number(data.balance) });
            queryClient.invalidateQueries({ queryKey: ["finance", "capital"] });
            toast.success("Account added");
            setOpen(false);
            reset();
        } catch(e) { toast.error("Failed"); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-black">Capital Accounts</h1>
                 <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl font-bold"><Plus className="mr-2 size-4"/> Add Account</Button></DialogTrigger>
                    <DialogContent className="rounded-2xl">
                        <DialogHeader><DialogTitle>New Capital Account</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Name</Label><Input {...register("name")} placeholder="Main Bank" required /></div>
                            <div className="space-y-2"><Label>Balance</Label><Input type="number" step="0.01" {...register("balance")} required /></div>
                            <div className="space-y-2"><Label>Currency</Label><Input {...register("currency")} defaultValue="USD" required /></div>
                            <DialogFooter><Button type="submit" className="w-full rounded-xl font-bold">Save</Button></DialogFooter>
                        </form>
                    </DialogContent>
                 </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {capital?.map(c => (
                    <Card key={c.id} className="rounded-2xl border-border bg-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{c.name}</CardTitle>
                             <Wallet className="size-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{c.currency} {c.balance.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
