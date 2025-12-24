"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Plus, 
  Search, 
  FileText, 
  ChevronRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";

export default function ClientInvoicesPage() {
  const [search, setSearch] = useState("");
  
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.invoices.list,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      // Find the project, then the client... although model doesn't link invoice directly to client
      // Let's assume for this mock view we just search by month or currency as per standard list
      return inv.billing_month.toLowerCase().includes(search.toLowerCase());
    });
  }, [invoices, search]);

  if (invoicesLoading || clientsLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="space-y-4">
           {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
            Revenue Journal
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Billed engagements and receivables across your client portfolio.</p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold border-none h-11 px-6">
          <Plus className="size-4 mr-2" />
          General Invoice
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="px-2">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by billing cycle (e.g. October)..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid gap-3 px-2">
        {filteredInvoices.map((inv) => (
          <Card key={inv.id} className="group border-border/40 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 rounded-xl overflow-hidden">
             <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                   <div className="size-14 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <FileText className="size-7 text-muted-foreground group-hover:text-primary transition-colors" />
                   </div>
                   
                   <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h3 className="font-black text-lg tracking-tight truncate">INV-{inv.id.slice(0, 8)}</h3>
                        <Badge variant="outline" className={`w-fit mx-auto md:mx-0 px-2 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {inv.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                            <Clock className="size-3.5" />
                            {inv.billing_month} Cycle
                         </div>
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                            <Building2 className="size-3.5" />
                            Portfolio Revenue
                         </div>
                      </div>
                   </div>

                   <div className="flex flex-col items-center md:items-end gap-1 px-8 md:border-x border-border/30">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">Gross Total</span>
                      <div className="text-xl font-black tabular-nums tracking-tighter">${inv.total_amount.toLocaleString()}</div>
                   </div>

                   <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10">
                         <Download className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-10 rounded-xl">
                         <MoreHorizontal className="size-4" />
                      </Button>
                   </div>
                </div>
             </CardContent>
          </Card>
        ))}

        {filteredInvoices.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <h3 className="text-lg font-bold text-foreground">No invoices found</h3>
            <p className="text-muted-foreground text-sm">Try matching a different billing month.</p>
          </div>
        )}
      </div>
    </div>
  );
}
