"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Users, 
  Search, 
  Plus, 
  ExternalLink,
  ArrowRight,
  MapPin,
  Globe,
  Star,
  Zap,
  CheckCircle2,
  Clock,
  Briefcase,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import Link from "next/link";

export default function AvailabilityPage() {
  const [search, setSearch] = useState("");
  const { data: talents, isLoading } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
  });

  const availableTalent = useMemo(() => {
    if (!talents) return [];
    return talents.filter(t => {
      const isBench = t.status?.toUpperCase() === 'BENCH_AVAILABLE';
      const matchesSearch = (t.first_name + " " + t.last_name).toLowerCase().includes(search.toLowerCase()) ||
                            t.role?.toLowerCase().includes(search.toLowerCase());
      return isBench && matchesSearch;
    });
  }, [talents, search]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-2">
         <Skeleton className="h-10 w-48 rounded-xl" />
         <Skeleton className="h-12 w-full rounded-xl" />
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2">
        <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                Active Bench
            </Badge>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Resource Availability</h1>
        <p className="text-muted-foreground text-sm font-medium">Identify and assign available consultants to upcoming projects.</p>
      </div>

      {/* Search Bar */}
      <div className="px-2">
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Filter available talent by name or expertise..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {availableTalent.map((t) => (
          <Card key={t.id} className="group relative overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500">
             <CardContent className="p-0">
                <div className="p-8 pb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center text-emerald-500 font-black text-lg shadow-inner group-hover:scale-110 transition-transform">
                            {t.first_name?.[0]}{t.last_name?.[0]}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Available</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors truncate">
                            {t.first_name} {t.last_name}
                        </h3>
                        <p className="text-[11px] font-bold text-muted-foreground/80 tracking-tight uppercase tracking-widest">{t.role || "Consultant"}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-1.5">
                        {t.skills?.slice(0, 3).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="bg-muted/50 text-[9px] font-bold rounded-lg border-none px-2 py-0.5">
                                {skill}
                            </Badge>
                        ))}
                        {(t.skills?.length || 0) > 3 && (
                            <Badge variant="secondary" className="bg-muted/50 text-[9px] font-bold rounded-lg border-none px-2 py-0.5">
                                +{t.skills!.length - 3}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="px-8 py-5 bg-muted/20 border-t border-border/40 flex justify-between items-center group-hover:bg-emerald-500/5 transition-colors">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[80px]">{t.country || "Global"}</span>
                    </div>
                    <Button asChild size="sm" className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20 border-none transition-all hover:translate-x-1">
                        <Link href={`/projects/new?talent_id=${t.id}`}>
                            Assign
                            <ArrowRight className="size-3" />
                        </Link>
                    </Button>
                </div>
             </CardContent>
          </Card>
        ))}

        {availableTalent.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <CheckCircle2 className="size-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-foreground">Bench is empty</h3>
            <p className="text-muted-foreground font-medium">All talent are currently assigned to projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
