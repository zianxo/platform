"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type Client } from "@/lib/api";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

export interface ClientFormData extends Partial<Client> {
    contact_first_name?: string;
    contact_last_name?: string;
    contact_email?: string;
    contact_role?: string;
}

interface ClientFormProps {
    initialData?: Partial<Client>;
    onSubmit: (data: ClientFormData) => void;
    isLoading?: boolean;
    buttonText?: string;
    mode?: 'create' | 'edit';
}

export function ClientForm({ initialData, onSubmit, isLoading, buttonText = "Save Client", mode = 'create' }: ClientFormProps) {
  const { register, handleSubmit, setValue, reset } = useForm<ClientFormData>({
      defaultValues: initialData
  });

  useEffect(() => {
    if (initialData) {
        reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Info */}
        <Card>
            <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input id="company_name" {...register("company_name", { required: true })} placeholder="Acme Inc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register("country")} placeholder="USA" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" {...register("timezone")} placeholder="EST" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="billing_currency">Currency</Label>
                    <Select onValueChange={(v) => setValue("billing_currency", v)} defaultValue={initialData?.billing_currency}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                     <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(v) => setValue("status", v)} defaultValue={initialData?.status}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="LEAD">Lead</SelectItem>
                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CHURNED">Churned</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input id="notes" {...register("notes")} placeholder="Billing details or notes..." />
                </div>
            </CardContent>
        </Card>

        {/* Primary Contact - Only show in Create mode or handling separately?
            For Edit, usually we edit contacts in the contacts tab. 
            So hiding this block for 'edit' mode to avoid confusion, or keeping it but it won't create new contacts unless logic handled.
            Simplest: Only show for create.
         */}
        {mode === 'create' && (
        <Card>
            <CardHeader><CardTitle>Primary Contact</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="c_first">First Name</Label>
                        <Input id="c_first" {...register("contact_first_name")} placeholder="John" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="c_last">Last Name</Label>
                        <Input id="c_last" {...register("contact_last_name")} placeholder="Doe" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="c_email">Email</Label>
                    <Input id="c_email" type="email" {...register("contact_email")} placeholder="john@acme.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="c_role">Role</Label>
                    <Input id="c_role" {...register("contact_role")} placeholder="CTO" />
                </div>
            </CardContent>
        </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : buttonText}
          </Button>
        </div>
      </form>
  );
}
