"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Plus, Mail, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { CreateUserModal } from "@/components/create-user-modal";
import { EditUserModal } from "@/components/edit-user-modal";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function ClientTeamPage() {
    const { data: userProfile, isLoading: isProfileLoading } = useQuery({
        queryKey: ["me"],
        queryFn: api.auth.me
    });

    const clientId = userProfile?.client_id;

    const { data: users, isLoading: isUsersLoading } = useQuery({
        queryKey: ["client-team", clientId],
        queryFn: () => api.users.list(clientId),
        enabled: !!clientId
    });

    const queryClient = useQueryClient();
    const deleteUserMutation = useMutation({
        mutationFn: api.users.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-team", clientId] });
            toast.success("Team member removed");
        },
        onError: () => toast.error("Failed to remove team member")
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    if (isProfileLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>;
    }

    const isClientAdmin = userProfile?.role === 'CLIENT_ADMIN' || userProfile?.role === 'ADMIN';

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground mt-2">
                        {isClientAdmin ? "Manage access and roles for your organization." : "View your team members."}
                    </p>
                </div>
                {isClientAdmin && (
                    <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="size-4 mr-2" />
                        Invite Member
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {isUsersLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                ) : users && users.length > 0 ? (
                    users.map((user: any) => (
                        <Card key={user.id} className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden ring-1 ring-border/5">
                            <CardContent className="flex justify-between items-center p-6 bg-card">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                        <User className="size-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg group-hover:text-primary transition-colors">{user.username}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                                                {user.role.replace('CLIENT_', '').replace('ADMIN', 'Admin').replace('USER', 'Member')}
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            <div className="flex items-center gap-2">
                                     {(isClientAdmin || user.id === userProfile?.id) && (
                                         <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} className="rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                             <Edit className="size-4 text-muted-foreground" />
                                         </Button>
                                     )}
                                     {isClientAdmin && user.id !== userProfile?.id && (
                                         <AlertDialog>
                                             <AlertDialogTrigger asChild>
                                                 <Button 
                                                     variant="ghost" 
                                                     size="icon" 
                                                     className="rounded-lg opacity-0 group-hover:opacity-100 transition-all text-destructive hover:text-destructive hover:bg-destructive/10"
                                                 >
                                                     <Trash2 className="size-4" />
                                                 </Button>
                                             </AlertDialogTrigger>
                                             <AlertDialogContent>
                                                 <AlertDialogHeader>
                                                     <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                                                     <AlertDialogDescription>
                                                         This will remove their access to this client portal immediately.
                                                     </AlertDialogDescription>
                                                 </AlertDialogHeader>
                                                 <AlertDialogFooter>
                                                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                     <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                         Remove
                                                     </AlertDialogAction>
                                                 </AlertDialogFooter>
                                             </AlertDialogContent>
                                         </AlertDialog>
                                     )}
                                 </div>
                             </CardContent>
                         </Card>
                     ))
                 ) : (
                     <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                         <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                             <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                 <User className="size-8 text-muted-foreground/50" />
                             </div>
                             <h3 className="text-lg font-bold text-foreground">No team members found</h3>
                             <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-[300px]">
                                 {isClientAdmin ? "You are the only one here. Invite your team to collaborate." : "You are the only member of this team."}
                             </p>
                             {isClientAdmin && (
                                <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl font-bold">
                                    Invite First Member
                                </Button>
                             )}
                         </CardContent>
                     </Card>
                 )}
             </div>
 
             {clientId && (
                 <CreateUserModal 
                     open={isCreateOpen} 
                     onOpenChange={setIsCreateOpen} 
                     defaultClientId={clientId} 
                 />
             )}
            
            <EditUserModal 
                open={!!editingUser} 
                onOpenChange={(open) => !open && setEditingUser(null)} 
                user={editingUser} 
                isClientAdmin={true}
            />
        </div>
    );
}
