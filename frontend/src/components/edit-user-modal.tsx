"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any; // Ideally typed
  isClientAdmin?: boolean; // If true, restrict fields
}

export function EditUserModal({ open, onOpenChange, user, isClientAdmin = false }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, setValue } = useForm()
  const [role, setRole] = useState("")

  useEffect(() => {
    if (user) {
        setValue("username", user.username)
        setValue("email", user.email)
        setRole(user.role)
    }
  }, [user, setValue])

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.users.update(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["client-users"] })
      queryClient.invalidateQueries({ queryKey: ["client-team"] }) // Covers all potential keys
      toast.success("User updated successfully")
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: any) => {
    // Only send role if changed or implementation requires it. 
    // Backend allows partial updates.
    const payload = { ...data, role };
    // Remove password if empty
    if (!payload.password) delete payload.password;
    updateMutation.mutate(payload);
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Modify user details. Leave password blank to keep unchanged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="jdoe" {...register("username", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="colleague@example.com" {...register("email", { required: true })} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password (Optional)</Label>
            <Input id="password" type="password" placeholder="••••••" {...register("password")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {isClientAdmin ? (
                 // Client Admin restricted view
                <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                    <SelectItem value="CLIENT_USER">Client User</SelectItem>
                </SelectContent>
                </Select>
            ) : (
                // Full Admin view
                <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                    <SelectItem value="CLIENT_USER">Client User</SelectItem>
                </SelectContent>
                </Select>
            )}
           
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
