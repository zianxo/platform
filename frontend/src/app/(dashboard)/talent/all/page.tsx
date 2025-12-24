"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Suspense } from "react";
import { 
  Search, 
  Plus, 
  ExternalLink,
  MoreHorizontal,
  Mail,
  MapPin,
  Globe,
  Star,
  Zap,
  Edit3,
  CheckCircle2,
  Clock,
  Filter,
  Users,
  Building2
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
import Link from "next/link";

function AllTalentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.toUpperCase() : "ALL";
  });

  const { data: talents, isLoading } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
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

  const filteredTalent = useMemo(() => {
    if (!talents) return [];
    return talents.filter(t => {
      const matchesSearch = (t.first_name + " " + t.last_name).toLowerCase().includes(search.toLowerCase()) ||
                            t.email.toLowerCase().includes(search.toLowerCase()) ||
                            t.role?.toLowerCase().includes(search.toLowerCase());
      
      const talentStatus = t.status?.toUpperCase() || "SOURCED"; // Default to Sourced if null
      const matchesStatus = statusFilter === "ALL" || talentStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [talents, search, statusFilter]);

  if (isLoading) {
    return <TalentListSkeleton />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Talent Directory</h1>
        <p className="text-muted-foreground text-sm font-medium">Browse and manage our global network of IT consultants.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name, email, or role..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-muted/30 rounded-[1.25rem] border border-border/50 overflow-x-auto no-scrollbar">
           {["ALL", "BENCH", "ACTIVE", "ASSIGNED", "INTERVIEW"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status 
                    ? "bg-white text-primary shadow-sm ring-1 ring-border/50 dark:bg-primary dark:text-primary-foreground" 
                    : "text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5"
                }`}
              >
                {status}
              </button>
           ))}
        </div>
      </div>

      {/* Talent Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {filteredTalent.map((t) => {
          const status = t.status?.toUpperCase() || "SOURCED";
          const isBench = status === "BENCH_AVAILABLE" || status === "BENCH_UNAVAILABLE";
          
          return (
            <Card key={t.id} className="group relative overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
               <CardContent className="p-0">
                  <div className="p-8 pb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                            {t.first_name?.[0]}{t.last_name?.[0]}
                        </div>
                         <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-9 rounded-xl hover:bg-primary/20 hover:text-primary transition-all bg-background/40 backdrop-blur-sm border border-white/10 shadow-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/talent/${t.id}/edit`);
                                }}
                            >
                                <Edit3 className="size-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-10 rounded-xl">
                                        <MoreHorizontal className="size-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 glass border-white/5 shadow-2xl rounded-xl p-2">
                                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Consultant Actions</DropdownMenuLabel>
                                 <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg" asChild>
                                    <Link href={`/talent/${t.id}`}><ExternalLink className="size-4" /> View Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg" asChild>
                                    <Link href={`/talent/${t.id}/edit`}><Edit3 className="size-4" /> Edit Profile</Link>
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem className="gap-2 cursor-pointer font-bold rounded-lg">
                                    <Mail className="size-4" /> Send Message
                                </DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-destructive focus:bg-destructive/10 rounded-lg">
                                    <Zap className="size-4" /> Terminate Contract
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                    </div>

                    <div className="space-y-1">
                        <Badge variant="outline" className={`px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors mb-2 ${
                            isBench ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                        }`}>
                            {isBench ? <CheckCircle2 className="size-2.5 mr-1" /> : <Clock className="size-2.5 mr-1" />}
                            {status}
                        </Badge>
                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors truncate">
                            {t.first_name} {t.last_name}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground/80 tracking-tight">{t.role || "IT Consultant"}</p>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                            <Mail className="size-3.5" />
                            <span className="truncate">{t.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                            <MapPin className="size-3.5" />
                            <span>{t.country || "Global Remote"}</span>
                        </div>
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-muted/20 border-t border-border/40 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
                     <div className="flex items-center gap-1">
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black">{t.seniority || "Junior"}</span>
                     </div>
                     <Link href={`/talent/${t.id}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                        Profile Details
                     </Link>
                  </div>
               </CardContent>
            </Card>
          );
        })}

        {filteredTalent.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <Users className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">No consultants found</h3>
            <p className="text-muted-foreground font-medium">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TalentListSkeleton() {
  return (
    <div className="space-y-8 p-2">
       <Skeleton className="h-10 w-48 rounded-xl" />
       <div className="flex gap-4">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
       </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-xl" />
          ))}
       </div>
    </div>
  );
}

export default function AllTalentPage() {
  return (
    <Suspense fallback={<TalentListSkeleton />}>
      <AllTalentPageContent />
    </Suspense>
  );
}
