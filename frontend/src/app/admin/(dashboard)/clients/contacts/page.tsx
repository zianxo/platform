"use client";

export const dynamic = 'force-dynamic';

import { useQuery, useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreHorizontal,
  User,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { EditContactModal } from "@/components/edit-contact-modal";
import { AddContactModal } from "@/components/add-contact-modal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ClientContactsPage() {
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const queryClient = useQueryClient();
  
  // 1. Fetch all clients
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  // 2. Fetch contacts for EACH client in parallel (Aggregating)
  const contactQueries = useQueries({
    queries: (clients || []).map((client) => ({
      queryKey: ["client-contacts", client.id],
      queryFn: () => api.clients.listContacts(client.id),
      staleTime: 1000 * 60 * 5, // 5 mins
    })),
  });

  const isContactsLoading = contactQueries.some(q => q.isLoading);
  const isLoading = isClientsLoading || isContactsLoading;

  // 3. Flatten and standardize contacts list
  const allContacts = useMemo(() => {
    if (!clients) return [];
    
    // Map client ID to Client Name for easy lookup
    const clientMap = new Map(clients.map(c => [c.id, c.company_name]));

    const contacts = contactQueries.flatMap((query, index) => {
       const client = clients[index];
       if (!client || !query.data || !Array.isArray(query.data)) return [];
       
       return query.data.map((contact: any) => ({
           id: contact.id,
           first_name: contact.first_name,
           last_name: contact.last_name,
           name: `${contact.first_name} ${contact.last_name}`,
           role: contact.role,
           email: contact.email,
           phone: contact.phone || "N/A",
           clientId: client.id,
           clientName: clientMap.get(client.id) || "Unknown Client",
           isPrimary: contact.is_primary
       }));
    });

    return contacts;
  }, [clients, contactQueries]);

  const filteredContacts = useMemo(() => {
    return allContacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [allContacts, search]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="space-y-4">
           {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-20 w-full rounded-xl" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 mb-2">
            Client Contacts
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Directory of key stakeholders and points of contact across your portfolio.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6 hover:scale-105 transition-transform"
        >
          <Plus className="size-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="px-2">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name, role, or company..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="grid gap-3 px-2">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="group border-border/40 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-xl overflow-hidden ring-1 ring-border/5">
             <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                   <div className="size-14 rounded-xl bg-gradient-to-br from-muted/50 to-muted/10 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/5 transition-all border border-border/50 group-hover:border-primary/20">
                      <span className="text-lg font-black text-muted-foreground group-hover:text-primary transition-colors">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </span>
                   </div>
                   
                   <div className="flex-1 text-center md:text-left space-y-1">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <h3 className="font-black text-lg tracking-tight">{contact.name}</h3>
                        {contact.isPrimary && (
                            <Badge className="rounded-md px-1.5 py-0 text-[9px] bg-emerald-500/10 text-emerald-500 border-0 pointer-events-none font-bold uppercase tracking-wider">
                                Primary
                            </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Building2 className="size-3.5" />
                            {contact.clientName}
                         </div>
                         <span className="text-muted-foreground/30 text-[10px]">•</span>
                         <div className="text-[11px] font-bold text-primary/80 uppercase tracking-wider">
                            {contact.role}
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col items-center md:items-end gap-2 px-8 md:border-x border-border/30 min-w-[200px]">
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs font-bold text-foreground/80 hover:text-primary transition-colors">
                         <Mail className="size-3.5 text-primary/60" />
                         {contact.email}
                      </a>
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                         <Phone className="size-3.5 text-primary/60" />
                         {contact.phone}
                      </div>
                   </div>

                   <div className="flex items-center gap-2 pl-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                             <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedContact(contact);
                              setIsEditModalOpen(true);
                            }}
                            className="rounded-lg font-bold py-2"
                          >
                             Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this contact?")) {
                                try {
                                  await api.clients.deleteContact(contact.clientId, contact.id);
                                  toast.success("Contact deleted");
                                  // Invalidate relevant queries
                                  queryClient.invalidateQueries({ queryKey: ["client-contacts", contact.clientId] });
                                } catch (e) {
                                  toast.error("Failed to delete contact");
                                }
                              }
                            }}
                            className="rounded-lg font-bold py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                             Delete Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </div>
             </CardContent>
          </Card>
        ))}

        {filteredContacts.length === 0 && !isLoading && (
          <div className="py-20 flex flex-col items-center justify-center bg-card border-2 border-dashed border-border/50 rounded-xl">
            <div className="size-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
                <User className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No contacts found</h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center mt-2">
                {search ? "Try adjusting your search terms." : "Add contacts to your clients to see them listed here."}
            </p>
            {!search && (
                <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="mt-6 rounded-xl font-bold">
                    Add First Contact
                </Button>
            )}
          </div>
        )}
      </div>

      <AddContactModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        clients={clients || []} 
      />

      <EditContactModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        contact={selectedContact}
        clientId={selectedContact?.clientId}
      />
    </div>
  );
}
