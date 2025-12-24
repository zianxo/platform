"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  Briefcase, 
  FileText,
  Loader2,
  Save
} from "lucide-react";
import { toast } from "sonner";
import type { Document } from "@/lib/api";

interface EditDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
}

export function EditDocumentModal({ 
  open, 
  onOpenChange, 
  document 
}: EditDocumentModalProps) {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [entityType, setEntityType] = useState<string>("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setFileName(document.file_name);
      setEntityType(document.entity_type);
      setSelectedEntityId(document.entity_id);
      setStatus(document.status);
    }
  }, [document]);

  // Fetch entities based on selection
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
    enabled: entityType === "CLIENT",
  });

  const { data: talent, isLoading: loadingTalent } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
    enabled: entityType === "TALENT",
  });

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
    enabled: entityType === "PROJECT",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    
    setIsSaving(true);
    
    try {
      await api.documents.update(document.id, {
        file_name: fileName,
        entity_type: entityType,
        entity_id: selectedEntityId,
        status: status,
      });

      queryClient.invalidateQueries({ queryKey: ["documents"] });

      toast.success("Document updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoadingEntities = loadingClients || loadingTalent || loadingProjects;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-popover/95 backdrop-blur-2xl border-border rounded-[2.5rem] shadow-2xl p-8">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <FileText className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Edit Document</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Update document properties and entity linkage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="py-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">File Name</Label>
            <Input 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              className="h-12 bg-card border-border/50 rounded-xl font-semibold focus:ring-primary/20 shadow-sm px-4"
              placeholder="Enter file name..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">Entity Category</Label>
              <Select value={entityType} onValueChange={(val) => {
                setEntityType(val);
                setSelectedEntityId("");
              }}>
                <SelectTrigger className="h-12 bg-card border-border/50 rounded-xl font-semibold focus:ring-primary/20 shadow-sm px-4">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
                  <SelectItem value="CLIENT" className="py-2.5 cursor-pointer">
                    <div className="flex items-center gap-2 font-semibold">
                      <Building2 className="size-4 text-blue-500" /> Client
                    </div>
                  </SelectItem>
                  <SelectItem value="TALENT" className="py-2.5 cursor-pointer">
                    <div className="flex items-center gap-2 font-semibold">
                      <Users className="size-4 text-emerald-500" /> Talent
                    </div>
                  </SelectItem>
                  <SelectItem value="PROJECT" className="py-2.5 cursor-pointer">
                    <div className="flex items-center gap-2 font-semibold">
                      <Briefcase className="size-4 text-amber-500" /> Project
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">
                Target Entity
               </Label>
               <Select value={selectedEntityId} onValueChange={setSelectedEntityId} disabled={!entityType || isLoadingEntities}>
                <SelectTrigger className="h-12 bg-card border-border/50 rounded-xl font-semibold focus:ring-primary/20 shadow-sm px-4">
                  {isLoadingEntities ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Loading...
                    </div>
                  ) : (
                    <SelectValue placeholder={entityType ? `Select ${entityType.toLowerCase()}...` : "Select category first"} />
                  )}
                </SelectTrigger>
                <SelectContent className="bg-popover/90 backdrop-blur-xl border-border rounded-xl max-h-[250px]">
                  {entityType === "CLIENT" && clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-semibold">{c.company_name}</SelectItem>
                  ))}
                  {entityType === "TALENT" && talent?.map(t => (
                    <SelectItem key={t.id} value={t.id} className="font-semibold">{t.first_name} {t.last_name}</SelectItem>
                  ))}
                  {entityType === "PROJECT" && projects?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-semibold">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 bg-card border-border/50 rounded-xl font-semibold focus:ring-primary/20 shadow-sm px-4">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
                <SelectItem value="DRAFT" className="py-2.5 cursor-pointer font-semibold">Draft</SelectItem>
                <SelectItem value="REVIEW" className="py-2.5 cursor-pointer font-semibold">Under Review</SelectItem>
                <SelectItem value="SIGNED" className="py-2.5 cursor-pointer font-semibold">Signed</SelectItem>
                <SelectItem value="EXPIRED" className="py-2.5 cursor-pointer font-semibold">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="h-12 rounded-xl font-bold px-6 flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="h-12 rounded-xl font-bold px-6 flex-1 bg-primary text-white shadow-lg shadow-primary/20"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
