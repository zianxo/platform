"use client";

export const dynamic = 'force-dynamic';

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Users, 
  Briefcase,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { toast } from "sonner";

function AllClientsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [archivingClientId, setArchivingClientId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.toUpperCase() : "ALL";
  });

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.clients.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client archived successfully");
      setArchivingClientId(null);
    },
    onError: () => {
      toast.error("Failed to archive client");
      setArchivingClientId(null);
    }
  });

  // Reactive sync with URL
  useEffect(() => {
    const status = searchParams.get("status");
    const normalizedStatus = status ? status.toUpperCase() : "ALL";
    if (normalizedStatus !== statusFilter) {
      setStatusFilter(normalizedStatus);
    }
  }, [searchParams, statusFilter]);

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value.toLowerCase());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c => {
      const matchesSearch = c.company_name.toLowerCase().includes(search.toLowerCase()) ||
                            (c.industry || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
         <Skeleton className="h-10 w-48 rounded-xl" />
         <div className="flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
         </div>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 mb-2">
            All Clients
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Browse and manage your entire client portfolio.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by company name or industry..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <select 
             value={statusFilter} 
             onChange={(e) => handleStatusChange(e.target.value)}
             className="h-12 px-6 bg-card border-border/50 rounded-xl font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
           >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PROSPECT">Prospect</option>
           </select>
           <Button className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2">
              <Plus className="size-4" /> Add Client
           </Button>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {filteredClients.map((client) => {
          const clientProjects = projects?.filter(p => p.client_id === client.id) || [];
          
          return (
            <Card key={client.id} className="group relative overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
               <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="size-16 rounded-xl bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Building2 className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="size-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="size-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
                           <DropdownMenuItem asChild className="gap-2 cursor-pointer font-bold rounded-lg">
                              <Link href={`/clients/${client.id}`}>
                                <ExternalLink className="size-4" /> View Detail
                              </Link>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg">
                              <Mail className="size-4" /> Contact
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem 
                              className="gap-2 cursor-pointer font-bold text-destructive focus:bg-destructive/10 rounded-lg"
                              onClick={() => setArchivingClientId(client.id)}
                           >
                              <Trash2 className="size-4" /> Archive Client
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>

                  <div>
                     <Badge variant="outline" className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors mb-2 ${
                        client.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                     }`}>
                        {client.status}
                     </Badge>
                     <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {client.company_name}
                     </h3>
                     <p className="text-xs font-medium text-muted-foreground mt-1">{client.industry || "Professional Services"}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                     <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                        <MapPin className="size-3.5 text-primary/60" />
                        {client.address ? "Multiple Locations" : "Global Headquarters"}
                     </div>
                     <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                        <Briefcase className="size-3.5 text-primary/60" />
                        {clientProjects.length} Active Engagements
                     </div>
                  </div>

                  <div className="pt-6 border-t border-border/40">
                     <Button variant="ghost" className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-primary gap-2" asChild>
                        <Link href={`/clients/${client.id}`}>
                           Explore Engagement <ChevronRight className="size-3.5" />
                        </Link>
                     </Button>
                  </div>
               </CardContent>
            </Card>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-xl bg-muted/30 flex items-center justify-center mb-6">
              <Building2 className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">No clients found</h3>
            <p className="text-muted-foreground font-medium">Try matching different statuses or keywords.</p>
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      {archivingClientId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border-border rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-black tracking-tight mb-2">Archive Client?</h3>
            <p className="text-muted-foreground mb-6">This will change the client status to ARCHIVED. You can restore it later by updating the status.</p>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setArchivingClientId(null)}
                className="flex-1 rounded-xl h-11 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => archiveMutation.mutate(archivingClientId)}
                disabled={archiveMutation.isPending}
                className="flex-1 rounded-xl h-11 font-bold bg-destructive hover:bg-destructive/90"
              >
                {archiveMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AllClientsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 p-8">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <AllClientsPageContent />
    </Suspense>
  );
}
