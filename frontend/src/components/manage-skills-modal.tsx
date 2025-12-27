"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Tag, BrainCircuit, Edit2, Check, X } from "lucide-react";

interface ManageSkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: { id: string, name: string, category: string }[];
}

const DEFAULT_CATEGORIES = [
  "Frontend Development",
  "Backend & API",
  "Cloud & DevOps",
  "AI & Data Science",
  "Cybersecurity",
  "Core Engineering",
  "Design",
  "Product",
  "General"
];

export function ManageSkillsModal({ open, onOpenChange, skills }: ManageSkillsModalProps) {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("General");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryEditValue, setCategoryEditValue] = useState("");
  
  const queryClient = useQueryClient();

  const createSkillMutation = useMutation({
    mutationFn: (data: { name: string, category: string }) => api.skills.create(data.name, data.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill added successfully");
      setNewSkillName("");
    },
    onError: () => {
      toast.error("Failed to add skill");
    }
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => api.skills.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Skill removed");
    },
    onError: () => {
      toast.error("Failed to remove skill");
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { oldName: string, newName: string }) => api.skills.updateCategory(data.oldName, data.newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success("Category renamed successfully");
      setEditingCategory(null);
    },
    onError: () => {
      toast.error("Failed to rename category");
    }
  });

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    createSkillMutation.mutate({ name: newSkillName.trim(), category: newSkillCategory });
  };

  const handleRenameCategory = (oldName: string) => {
    if (!categoryEditValue.trim() || categoryEditValue === oldName) {
        setEditingCategory(null);
        return;
    }
    updateCategoryMutation.mutate({ oldName, newName: categoryEditValue.trim() });
  };

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...skills.map(s => s.category)]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass border-white/10 rounded-xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tag className="size-5" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Manage Skills</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground font-medium">
            Define expertise categories and technical skills for your Capability Matrix.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Add New Skill Form */}
          <form onSubmit={handleAddSkill} className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add New Skill</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name" className="text-[10px] uppercase font-bold text-muted-foreground">Skill Name</Label>
                <Input 
                  id="skill-name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Next.js, Rust"
                  className="bg-background/50 border-border/50 rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-category" className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
                  <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl glass border-white/5">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-lg font-medium">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={createSkillMutation.isPending || !newSkillName.trim()}
              className="w-full rounded-xl h-11 bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="size-3.5" />
              Add to Matrix
            </Button>
          </form>

          {/* Expert Categories & Skills List */}
          <div className="space-y-4">
             <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Skills Matrix</h4>
             <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-6 pr-2">
                {categories.map(category => {
                    const categorySkills = skills.filter(s => s.category === category);
                    if (categorySkills.length === 0 && !DEFAULT_CATEGORIES.includes(category)) return null;

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center justify-between group">
                                {editingCategory === category ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input 
                                            value={categoryEditValue}
                                            onChange={(e) => setCategoryEditValue(e.target.value)}
                                            className="h-8 bg-background border-primary/30 rounded-lg text-sm font-bold"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="size-8 rounded-lg text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleRenameCategory(category)}>
                                            <Check className="size-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10" onClick={() => setEditingCategory(null)}>
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h5 className="text-sm font-black tracking-tight flex items-center gap-2 text-primary">
                                            {category}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setCategoryEditValue(category);
                                                }}
                                            >
                                                <Edit2 className="size-3" />
                                            </Button>
                                        </h5>
                                        <span className="text-[10px] font-bold text-muted-foreground/60">{categorySkills.length} SKILLS</span>
                                    </>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {categorySkills.map(skill => (
                                    <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 group/skill hover:border-primary/20 transition-all">
                                        <span className="text-xs font-bold truncate pr-2">{skill.name}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            disabled={deleteSkillMutation.isPending}
                                            className="size-7 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/skill:opacity-100 transition-all"
                                            onClick={() => deleteSkillMutation.mutate(skill.id)}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}
                                {categorySkills.length === 0 && (
                                    <p className="col-span-2 text-[10px] text-muted-foreground italic pl-1">No skills in this category.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
