"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type Invoice } from "@/lib/api";
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
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { toast } from "sonner";

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<Partial<Invoice> & { line_items: any[] }>({
    defaultValues: {
        currency: "USD",
        status: "DRAFT",
        line_items: [{ description: "", amount: 0 }]
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
  
  // Watch line items to calculate total
  const lineItems = watch("line_items");
  const calculatedTotal = lineItems?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

  useEffect(() => {
      setValue("total_amount", calculatedTotal);
  }, [calculatedTotal, setValue]);

  const mutation = useMutation({
    mutationFn: api.invoices.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      router.push("/invoices");
    },
    onError: () => {
        toast.error("Failed to create invoice.");
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
        ...data,
        total_amount: Number(data.total_amount),
        line_items: data.line_items.map((item: any) => ({
            ...item,
            amount: Number(item.amount)
        }))
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Draft a new invoice for a client.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Client</Label>
                        <Select onValueChange={(v) => setValue("client_id", v)}>
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
                        <Label>Billing Month</Label>
                        <Input {...register("billing_month", { required: true })} placeholder="2025-01" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Currency</Label>
                         <Select onValueChange={(v) => setValue("currency", v)} defaultValue="USD">
                            <SelectTrigger>
                                <SelectValue placeholder="USD" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                         <Label>Status</Label>
                         <Select onValueChange={(v: any) => setValue("status", v)} defaultValue="DRAFT">
                            <SelectTrigger>
                                <SelectValue placeholder="DRAFT" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="SENT">Sent</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", amount: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                             <Label className={index !== 0 ? "sr-only" : ""}>Description</Label>
                             <Input {...register(`line_items.${index}.description` as const, { required: true })} placeholder="Service description..." />
                        </div>
                        <div className="w-32 space-y-2">
                             <Label className={index !== 0 ? "sr-only" : ""}>Amount</Label>
                             <Input type="number" step="0.01" {...register(`line_items.${index}.amount` as const, { required: true })} />
                        </div>
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        <Card>
            <CardContent className="pt-6 flex justify-between items-center">
                <div className="text-lg font-semibold">Total Amount</div>
                <div className="text-2xl font-bold">
                    {watch("currency")} {calculatedTotal.toFixed(2)}
                </div>
                {/* Hidden input to ensure it's registered if needed, though we set it in hooks */}
                 <input type="hidden" {...register("total_amount")} />
            </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
