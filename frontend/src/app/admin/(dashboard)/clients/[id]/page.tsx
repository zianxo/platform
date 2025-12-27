"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, User, Plus, Edit, Building2, FileText, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ProjectCard } from "@/components/project-card";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CreateUserModal } from "@/components/create-user-modal";
import { EditUserModal } from "@/components/edit-user-modal";
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

// Helper hook since api list filters aren't implemented in backend yet
function useClientDetail(id: string) {
    const { data } = useQuery({ queryKey: ["clients"], queryFn: api.clients.list });
    return data?.find(t => t.id === id);
}

import { Skeleton } from "@/components/ui/skeleton";

function ClientDetailSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4 px-1">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-xl" />
        </div>
        <div className="ml-auto">
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const client = useClientDetail(id);
  const queryClient = useQueryClient();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users } = useQuery({
      queryKey: ["client-users", id],
      queryFn: () => api.users.list(id),
      enabled: !!id
  });

  const { data: contacts } = useQuery({
      queryKey: ["client-contacts", id],
      queryFn: () => api.clients.listContacts(id),
      enabled: !!id
  });

  const { data: projects } = useQuery({
      queryKey: ["projects"],
      queryFn: api.projects.list
  });

  const { data: documents } = useQuery({
      queryKey: ["documents"],
      queryFn: api.documents.list
  });

  const clientProjects = projects?.filter(p => p.client_id === id) || [];
  const clientDocuments = documents?.filter(d => d.entity_id === id && d.entity_type === 'client') || [];

  const createContactMutation = useMutation({
      mutationFn: (data: any) => api.clients.createContact(id, data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["client-contacts", id] });
          toast.success("Contact added successfully");
          setIsContactOpen(false);
          setNewContact({
              first_name: "", last_name: "", email: "", role: "", is_primary: false
          });
      },
      onError: () => {
          toast.error("Failed to add contact");
      }
  });

  const deleteUserMutation = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client-users", id] });
        toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user")
  });

  const [newContact, setNewContact] = useState({
      first_name: "", last_name: "", email: "", role: "", is_primary: false
  });

  const handleCreateContact = (e: React.FormEvent) => {
      e.preventDefault();
      createContactMutation.mutate(newContact);
  };

  if (!client) return <ClientDetailSkeleton />;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4 px-1">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{client.company_name}</h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-border/50">
                {client.country || "Global"}
             </Badge>
             <span className="text-xs font-bold text-muted-foreground">•</span>
             <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-border/50">
                {client.billing_currency || "USD"}
             </Badge>
          </div>
        </div>
        <div className="ml-auto">
             <Link href={`/clients/${id}/edit`}>
                 <Button variant="outline" className="font-bold rounded-xl shadow-sm border-border/50 hover:bg-muted/50">
                    <Edit className="h-4 w-4 mr-2" />
                    Modify Data
                 </Button>
             </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
             <Tabs defaultValue="contacts" className="w-full">
                <TabsList className="w-full justify-start h-12 bg-muted/20 p-1 rounded-xl mb-6 border border-border/10">
                    <TabsTrigger value="contacts" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Contacts</TabsTrigger>
                    <TabsTrigger value="projects" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Projects</TabsTrigger>
                     <TabsTrigger value="documents" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Documents</TabsTrigger>
                     <TabsTrigger value="users" className="rounded-lg px-6 font-bold h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">Users</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contacts" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0">
                    <div className="grid gap-4">
                        {contacts && contacts.length > 0 ? (
                            contacts.map((contact: any) => (
                                <Card key={contact.id} className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden ring-1 ring-border/5">
                                    <CardContent className="flex justify-between items-center p-6 bg-card">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-500 font-bold text-lg border border-indigo-500/20">
                                                {contact.first_name[0]}{contact.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold flex items-center gap-2 text-lg">
                                                    {contact.first_name} {contact.last_name}
                                                    {contact.is_primary && <Badge className="rounded-md px-1.5 py-0 text-[9px] bg-emerald-500/10 text-emerald-500 border-0 pointer-events-none">PRIMARY</Badge>}
                                                </div>
                                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{contact.role}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <a href={`mailto:${contact.email}`} className="text-sm font-bold hover:text-primary transition-colors block">{contact.email}</a>
                                                <span className="text-[10px] text-muted-foreground font-medium">Email Address</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <Edit className="size-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                        <User className="size-6 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">No contacts found</h3>
                                    <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[200px]">Add key stakeholders for this client to keep track of communication.</p>
                                    <Button variant="outline" size="sm" onClick={() => setIsContactOpen(true)} className="rounded-lg font-bold">
                                        Add First Contact
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        
                        {contacts && contacts.length > 0 && (
                             <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full rounded-xl shadow-lg shadow-primary/20 h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Contact
                                    </Button>
                                </DialogTrigger>
                             </Dialog>
                        )}

                        <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                            <DialogContent className="rounded-xl border-border sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Contact</DialogTitle>
                                    <DialogDescription>Add a point of contact for this client.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateContact} className="space-y-4 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input required value={newContact.first_name} onChange={e => setNewContact({...newContact, first_name: e.target.value})} className="rounded-lg" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input required value={newContact.last_name} onChange={e => setNewContact({...newContact, last_name: e.target.value})} className="rounded-lg" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" required value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="rounded-lg" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input value={newContact.role} onChange={e => setNewContact({...newContact, role: e.target.value})} placeholder="e.g. CTO" className="rounded-lg" />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox 
                                            id="primary" 
                                            checked={newContact.is_primary} 
                                            onCheckedChange={(c) => setNewContact({...newContact, is_primary: !!c})}
                                            className="rounded-md"
                                        />
                                        <Label htmlFor="primary" className="font-bold cursor-pointer">Set as Primary Contact</Label>
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="submit" disabled={createContactMutation.isPending} className="rounded-lg font-bold">
                                            {createContactMutation.isPending ? "Adding..." : "Save Contact"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </TabsContent>
                
                 <TabsContent value="projects" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0">
                    {clientProjects.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                             {clientProjects.map((project: any) => (
                                 <div key={project.id} className="h-[280px]">
                                     <ProjectCard project={project} clientName={client.company_name} />
                                 </div>
                             ))}
                        </div>
                    ) : (
                         <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                    <Building2 className="size-6 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No active projects</h3>
                                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[200px]">Create an engagement to start tracking work.</p>
                                <Button variant="outline" size="sm" asChild className="rounded-lg font-bold">
                                    <Link href="/projects/new">Create Project</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                 </TabsContent>
                 
                 <TabsContent value="documents" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0">
                     {clientDocuments.length > 0 ? (
                        <div className="grid gap-3">
                            {clientDocuments.map((doc: any) => (
                                <Card key={doc.id} className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden ring-1 ring-border/5">
                                    <CardContent className="flex justify-between items-center p-4 bg-card">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                                <FileText className="size-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm truncate max-w-[300px] group-hover:text-primary transition-colors">{doc.file_name}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                                                    {(doc.file_size / 1024).toFixed(0)} KB • {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <Download className="size-4 text-muted-foreground" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     ) : (
                         <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                    <FileText className="size-6 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No documents uploaded</h3>
                                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[200px]">Upload contracts, NDAs, or invoices.</p>
                                <Button variant="outline" size="sm" className="rounded-lg font-bold">
                                    Upload Document
                                </Button>
                            </CardContent>
                        </Card>
                     )}
                 </TabsContent>
                 
                 <TabsContent value="users" className="space-y-4 focus-visible:outline-none focus-visible:ring-0 mt-0">
                     {users && users.length > 0 ? (
                        <div className="grid gap-3">
                            {users.map((user: any) => (
                                <Card key={user.id} className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden ring-1 ring-border/5">
                                    <CardContent className="flex justify-between items-center p-4 bg-card">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                                <User className="size-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm truncate max-w-[300px] group-hover:text-primary transition-colors">{user.username}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                                                    {user.email} • {user.role}
                                                </div>
                                            </div>
                                        </div>
                          <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)} className="rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                <Edit className="size-4 text-muted-foreground" />
                                            </Button>
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
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the user account
                                                            and remove their access to the platform.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteUserMutation.mutate(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     ) : (
                         <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                    <User className="size-6 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">No users found</h3>
                                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[200px]">Create a login for this client.</p>
                                <Button variant="outline" size="sm" onClick={() => setIsCreateUserOpen(true)} className="rounded-lg font-bold">
                                    Create User
                                </Button>
                            </CardContent>
                        </Card>
                     )}
                     
                     {users && users.length > 0 && (
                         <Button onClick={() => setIsCreateUserOpen(true)} className="w-full rounded-xl shadow-lg shadow-primary/20 h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                             <Plus className="h-4 w-4 mr-2" />
                             Add User
                         </Button>
                     )}
                 </TabsContent>
             </Tabs>

             <CreateUserModal open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen} defaultClientId={id} />
             <EditUserModal open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)} user={editingUser} />

        </div>
        
         <div className="space-y-6">
            <Card className="rounded-xl border-border/50 shadow-sm ring-1 ring-border/5 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/50"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Status Overview</CardTitle></CardHeader>
                <CardContent className="pt-6">
                    <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                        {client.status}
                    </Badge>
                </CardContent>
            </Card>
             <Card className="rounded-xl border-border/50 shadow-sm ring-1 ring-border/5 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/50"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Client Notes</CardTitle></CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{client.notes || "No additional notes recorded."}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
