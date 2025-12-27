
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: any;
  clientId: string;
}

export function EditContactModal({ open, onOpenChange, contact, clientId }: EditContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    email: "",
    phone: "",
    isPrimary: false
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.first_name || "",
        lastName: contact.last_name || "",
        role: contact.role || "",
        email: contact.email || "",
        phone: contact.phone || "",
        isPrimary: contact.isPrimary || false
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.clients.updateContact(clientId, contact.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        is_primary: formData.isPrimary
      });
      
      toast.success("Contact updated successfully");
      queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    
    setIsDeleting(true);
    try {
      await api.clients.deleteContact(clientId, contact.id);
      toast.success("Contact deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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

          <div className="flex items-center gap-2 pt-2">
             <input 
                type="checkbox" 
                id="isPrimary" 
                checked={formData.isPrimary}
                onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
                className="rounded border-gray-300 text-primary focus:ring-primary"
             />
             <Label htmlFor="isPrimary" className="text-sm font-medium">Primary Contact</Label>
          </div>

          <DialogFooter className="pt-4 flex justify-between sm:justify-between items-center gap-2">
             <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete} 
                className="rounded-xl font-bold gap-2"
                disabled={isDeleting || isSubmitting}
             >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
             </Button>
             <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="rounded-xl font-bold bg-primary text-primary-foreground" disabled={isSubmitting || isDeleting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Changes
                </Button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
