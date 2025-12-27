
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Client {
  id: string;
  company_name: string;
}

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  defaultClientId?: string;
}

export function AddContactModal({ open, onOpenChange, clients, defaultClientId }: AddContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    clientId: defaultClientId || "",
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.error("Please select a client");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.clients.createContact(formData.clientId, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone
      });
      
      toast.success("Contact added successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] }); // Invalidate clients to refresh contacts if they are nested?
      // Note: The current viewing page mocks contacts from clients list. 
      // If the backend adds contacts to a sub-table, we might need a separate query or ensure clients list includes it.
      // Assuming 'clients' list update is enough or we might need to fetch contacts separately if the page evolves.
      // For now, invalidating "clients" should be safe.
      
      onOpenChange(false);
      setFormData({
        clientId: defaultClientId || "",
        firstName: "",
        lastName: "",
        role: "",
        email: "",
        phone: ""
      });
    } catch (error) {
      toast.error("Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select 
              value={formData.clientId} 
              onValueChange={(val) => setFormData({...formData, clientId: val})}
              disabled={!!defaultClientId}
            >
              <SelectTrigger id="client" className="h-10 rounded-xl">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role / Job Title</Label>
            <Input 
              id="role" 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
              className="rounded-xl"
              placeholder="e.g. Head of Product"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input 
              id="phone" 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="rounded-xl"
            />
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
             <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
               Save Contact
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
