"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ContextualContractsViewSkeleton } from "@/components/contextual-contracts-view";
import { Suspense } from "react";
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSignature,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Calendar,
  ShieldAlert
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
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useClientContext } from "@/components/providers/client-provider";

function AllContractsPageContent() {
  const { activeClient } = useClientContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.toUpperCase() : "ALL";
  });

  const [typeFilter, setTypeFilter] = useState(() => {
    const type = searchParams.get("type");
    return type ? type.toUpperCase() : "ALL";
  });

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: api.contracts.list,
  });

  // Reactive sync with URL
  useEffect(() => {
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    
    if (status) setStatusFilter(status.toUpperCase());
    else setStatusFilter("ALL");

    if (type) setTypeFilter(type.toUpperCase());
    else setTypeFilter("ALL");
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value.toLowerCase());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter(c => {
      const matchesClient = !activeClient || c.client_id === activeClient.id;
      const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesType = typeFilter === "ALL" || c.type === typeFilter;
      return matchesClient && matchesSearch && matchesStatus && matchesType;
    });
  }, [contracts, search, statusFilter, typeFilter, activeClient]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SIGNED":
      case "ACTIVE":
        return { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 };
      case "SENT":
        return { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: AlertCircle };
      case "DRAFT":
        return { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Clock };
      case "EXPIRED":
        return { color: "bg-destructive/10 text-destructive border-destructive/20", icon: ShieldAlert };
      default:
        return { color: "bg-primary/10 text-primary border-primary/20", icon: FileSignature };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-2">
         <Skeleton className="h-10 w-48 rounded-xl" />
         <div className="flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
         </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">All Contracts</h1>
        <p className="text-muted-foreground text-sm font-medium">Manage the full lifecycle of your legal agreements.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search contracts by ID..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <select 
             value={typeFilter} 
             onChange={(e) => handleFilterChange("type", e.target.value)}
             className="h-12 px-4 bg-card border-border/50 rounded-xl font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
           >
              <option value="ALL">All Types</option>
              <option value="MSA">MSA</option>
              <option value="SOW">SOW</option>
              <option value="NDA">NDA</option>
           </select>
           <select 
             value={statusFilter} 
             onChange={(e) => handleFilterChange("status", e.target.value)}
             className="h-12 px-4 bg-card border-border/50 rounded-xl font-bold text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
           >
              <option value="ALL">All Statuses</option>
              <option value="SIGNED">Signed</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="EXPIRED">Expired</option>
           </select>
        </div>
      </div>

      {/* Contract Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {filteredContracts.map((c) => {
          const status = getStatusConfig(c.status);
          const StatusIcon = status.icon;

          return (
            <Card key={c.id} className="group relative overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
               <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                     <div className="size-16 rounded-xl bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <FileSignature className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="size-10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="size-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
                           <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg">
                              <Download className="size-4" /> Download PDF
                           </DropdownMenuItem>
                           <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg">
                              <ExternalLink className="size-4" /> Viewer Original
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-destructive focus:bg-destructive/10 rounded-lg">
                              <Trash2 className="size-4" /> Delete Contract
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>

                  <div>
                     <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors mb-2 ${status.color}`}>
                        <StatusIcon className="size-2.5 mr-1.5" />
                        {c.status}
                     </Badge>
                     <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                        {c.type} Agreement
                     </h3>
                     <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tighter mt-1">ID: {c.id.slice(0, 13)}...</p>
                  </div>

                  <div className="pt-6 border-t border-border/40 grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Effectivity</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/80">
                           <Calendar className="size-3.5 text-primary/60" />
                           {format(new Date(c.start_date), 'MMM d, yyyy')}
                        </div>
                     </div>
                     <div className="space-y-1 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Notice</span>
                        <div className="text-xs font-bold text-foreground/80">
                           {c.notice_period_days} Days
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          );
        })}

        {filteredContracts.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <FileSignature className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">No contracts found</h3>
            <p className="text-muted-foreground font-medium">Try matching different types or statuses.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllContractsPage() {
  return (
    <Suspense fallback={<ContextualContractsViewSkeleton />}>
      <AllContractsPageContent />
    </Suspense>
  );
}
