"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api, type Talent } from "@/lib/api";
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
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface TalentFormProps {
    initialData?: Partial<Talent>;
    onSubmit: (data: Partial<Talent>) => void;
    isLoading?: boolean;
    buttonText?: string;
}

export function TalentForm({ initialData, onSubmit, isLoading, buttonText = "Save Talent" }: TalentFormProps) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<Partial<Talent>>({
      defaultValues: initialData
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.skills || []);

  const { data: availableSkills } = useQuery({ 
      queryKey: ["skills"], 
      queryFn: api.skills.list 
  });

  // Update form if initialData changes (e.g. loaded from API)
  // And map initial skill NAMES to IDs because backend returns names but we work with IDs locally for selection
  useEffect(() => {
	if (initialData && availableSkills) {
		reset(initialData);
        // Backend returns ["React", "Python"] (Names)
        // We need component state to be ["uuid-1", "uuid-2"] (IDs)
        const initialSkillIds = (initialData.skills || [])
            .map(name => availableSkills.find(s => s.name === name)?.id)
            .filter(id => id !== undefined) as string[];
            
		setSelectedSkills(initialSkillIds);
	}
  }, [initialData, reset, availableSkills]);

  const handleFormSubmit = (data: Partial<Talent>) => {
    onSubmit({ ...data, skills: selectedSkills });
  };

  const toggleSkill = (skillId: string) => {
      if (selectedSkills.includes(skillId)) {
          setSelectedSkills(prev => prev.filter(id => id !== skillId));
      } else {
          setSelectedSkills(prev => [...prev, skillId]);
      }
  }

  return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register("first_name", { required: true })} placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register("last_name", { required: true })} placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email", { required: true })} placeholder="jane@example.com" />
          </div>

            <div className="space-y-2">
			  <Label htmlFor="country">Country</Label>
			  <Input id="country" {...register("country")} placeholder="e.g. United States" />
			</div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(v) => setValue("role", v)} defaultValue={initialData?.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                  <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seniority">Seniority</Label>
              <Select onValueChange={(v) => setValue("seniority", v)} defaultValue={initialData?.seniority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Mid">Mid</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills Selection */}
          <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2 border p-4 rounded-md min-h-[100px]">
                  {availableSkills?.map(skill => (
                      <Badge 
                        key={skill.id} 
                        variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80"
                        onClick={() => toggleSkill(skill.id)}
                      >
                          {skill.name}
                      </Badge>
                  ))}
                  {(!availableSkills || availableSkills.length === 0) && (
                      <span className="text-muted-foreground text-sm">No skills found. Add some via API or DB.</span>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
               <Select onValueChange={(v) => setValue("source", v)} defaultValue={initialData?.source}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Job Board">Job Board</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
               <Select onValueChange={(v) => setValue("status", v as any)} defaultValue={initialData?.status || "SOURCED"}>
                  <SelectTrigger className="font-bold">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOURCED">Sourced</SelectItem>
                    <SelectItem value="PRE_SCREENED">Pre-Screened</SelectItem>
                    <SelectItem value="BENCH_AVAILABLE">Bench (Available)</SelectItem>
                    <SelectItem value="BENCH_UNAVAILABLE">Bench (Unavailable)</SelectItem>
                    <SelectItem value="ACTIVE_INTERVIEWING">Interviewing</SelectItem>
                    <SelectItem value="PLACED">Placed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

            <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Input id="notes" {...register("notes")} placeholder="Interview notes..." />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : buttonText}
            </Button>
          </div>
        </form>
  );
}
