"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Target, 
  Search, 
  Cpu, 
  Database, 
  Globe, 
  Layout, 
  ShieldCheck,
  BrainCircuit,
  Zap,
  Settings2,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ManageSkillsModal } from "@/components/manage-skills-modal";

// Helper to map categories to icons and colors
const categoryConfig: Record<string, { icon: any, color: string }> = {
  "Frontend Development": { icon: Layout, color: "bg-blue-500" },
  "Backend & API": { icon: Database, color: "bg-emerald-500" },
  "Cloud & DevOps": { icon: Globe, color: "bg-indigo-500" },
  "AI & Data Science": { icon: BrainCircuit, color: "bg-amber-500" },
  "Cybersecurity": { icon: ShieldCheck, color: "bg-rose-500" },
  "Core Engineering": { icon: Cpu, color: "bg-violet-500" },
  "General": { icon: Zap, color: "bg-slate-500" },
  "Design": { icon: Layout, color: "bg-pink-500" },
  "Product": { icon: Target, color: "bg-orange-500" },
};

export default function UnifiedSkillsPage() {
  const [search, setSearch] = useState("");
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const { data: talents, isLoading: talentLoading } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
  });

  const { data: rawSkills, isLoading: skillsLoading } = useQuery({
    queryKey: ["skills"],
    queryFn: api.skills.list,
  });

  const categories = useMemo(() => {
    if (!rawSkills || !talents) return [];

    const grouped = new Map<string, { name: string, skills: string[], count: number }>();

    rawSkills.forEach(skill => {
        const catName = skill.category || "General";
        if (!grouped.has(catName)) {
            grouped.set(catName, { name: catName, skills: [], count: 0 });
        }
        grouped.get(catName)!.skills.push(skill.name);
    });

    // Calculate expert counts per category
    talents.forEach(t => {
        const talentSkills = t.skills || [];
        grouped.forEach((val) => {
            if (val.skills.some(skName => talentSkills.includes(skName))) {
                val.count += 1;
            }
        });
    });

    return Array.from(grouped.values())
        .filter(cat => 
            cat.name.toLowerCase().includes(search.toLowerCase()) ||
            cat.skills.some(sk => sk.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => b.count - a.count);
  }, [rawSkills, talents, search]);

  if (talentLoading || skillsLoading) {
    return (
      <div className="space-y-8 p-2">
         <Skeleton className="h-10 w-48 rounded-xl" />
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="px-2 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">Capability Matrix</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage technical expertise categories and track talent coverage.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <Button 
                variant="outline" 
                onClick={() => setIsManageModalOpen(true)}
                className="h-12 px-6 rounded-xl border-border/50 bg-card hover:bg-muted font-bold gap-2 w-full md:w-auto shadow-sm"
            >
                <Settings2 className="size-4" />
                Manage Skills
            </Button>
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Filter matrix..." 
                className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-2">
        {categories.map((cat) => {
          const config = categoryConfig[cat.name] || categoryConfig["General"] || { icon: Zap, color: "bg-slate-500" };
          const Icon = config.icon;
          
          return (
            <Card key={cat.name} className="group relative overflow-hidden rounded-xl border-border/40 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
               <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-4">
                      <div className={`size-12 rounded-xl ${config.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="size-6" />
                      </div>
                      <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50"
                            onClick={() => setIsManageModalOpen(true)}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Badge variant="outline" className="px-2.5 py-0.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50">
                              {cat.count} Experts
                          </Badge>
                      </div>
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{cat.name}</CardTitle>
               </CardHeader>
               <CardContent className="px-8 pb-8">
                  <div className="flex flex-wrap gap-1.5 mb-6">
                      {cat.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-muted/50 text-[10px] font-bold rounded-xl border-none px-2.5 py-1">
                              {skill}
                          </Badge>
                      ))}
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>Market Coverage</span>
                          <span>{Math.min(100, Math.floor(cat.count * 15))}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                          <div 
                              className={`h-full ${config.color}`} 
                              style={{ width: `${Math.min(100, cat.count * 15)}%` }}
                          />
                      </div>
                  </div>
               </CardContent>
            </Card>
          );
        })}
        
        {categories.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card border-border/40 rounded-xl border-dashed border-2">
                <BrainCircuit className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground/80">No results found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
            </div>
        )}
      </div>

      <ManageSkillsModal 
        open={isManageModalOpen}
        onOpenChange={setIsManageModalOpen}
        skills={rawSkills || []}
      />
    </div>
  );
}
