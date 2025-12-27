"use client";

import { useState } from "react";
import { CreateUserModal } from "@/components/create-user-modal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <div className="grid gap-6 max-w-2xl">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ["me"], queryFn: api.auth.me });
  
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm({
      defaultValues: {
          company_name: "",
          email: "",
          password: "" // Optional
      }
  });

  useEffect(() => {
      if (user) {
          reset({
              company_name: user.company_name || "",
              email: user.email || "",
              password: ""
          });
      }
  }, [user, reset]);

  const updateMutation = useMutation({
      mutationFn: api.auth.updateProfile,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["me"] });
          toast.success("Profile updated successfully");
      },
      onError: (error) => {
          toast.error("Failed to update profile");
          console.error(error);
      }
  });

  const onSubmit = (data: any) => {
      // Remove empty password so it doesn't get hashed as empty string
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                 <div className="space-y-2">
                     <Label>Company Name</Label>
                     <Input {...register("company_name")} placeholder="My Company Ltd." />
                 </div>
                 <div className="space-y-2">
                     <Label>Admin Email</Label>
                     <Input {...register("email")} />
                 </div>
                 <div className="space-y-2">
                     <Label>New Password</Label>
                     <Input type="password" {...register("password")} placeholder="Leave blank to keep current" />
                 </div>
                 <Button type="submit" disabled={updateMutation.isPending}>
                     {updateMutation.isPending ? "Saving..." : "Save Changes"}
                 </Button>
             </form>
          </CardContent>
        </Card>

      </div>

      <CreateUserModal open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen} />
    </div>
  );
}
