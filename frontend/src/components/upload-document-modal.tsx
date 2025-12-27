"use client";

import { useState } from "react";
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
  Upload, 
  Building2, 
  Users, 
  Briefcase, 
  FileText,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { UploadDropzone } from "@/utils/uploadthing";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "CLIENT" | "TALENT" | "PROJECT" | "ALL";
  defaultEntityId?: string;
}

export function UploadDocumentModal({ 
  open, 
  onOpenChange, 
  defaultType = "ALL",
  defaultEntityId = ""
}: UploadDocumentModalProps) {
  const queryClient = useQueryClient();
  const [entityType, setEntityType] = useState<string>(defaultType === "ALL" ? "" : defaultType);
  const [selectedEntityId, setSelectedEntityId] = useState<string>(defaultEntityId);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUploadComplete = async (res: any) => {
    if (!res?.[0]) return;
    
    const uploadedFile = res[0];
    setIsUploading(true);
    
    try {
      await api.documents.create({
        entity_type: entityType,
        entity_id: selectedEntityId,
        file_name: uploadedFile.name,
        file_size: uploadedFile.size,
        file_type: uploadedFile.type || "application/pdf",
        status: "DRAFT",
        file_url: uploadedFile.url,
        file_key: uploadedFile.key,
      });

      queryClient.invalidateQueries({ queryKey: ["documents"] });

      toast.success("Document uploaded successfully", {
        description: `${uploadedFile.name} has been linked to the selected ${entityType.toLowerCase()}.`,
      });
      onOpenChange(false);
      setSelectedEntityId("");
      setEntityType(defaultType === "ALL" ? "" : defaultType);
    } catch (error) {
      toast.error("Failed to link document to database");
    } finally {
      setIsUploading(false);
    }
  };

  const isLoadingEntities = loadingClients || loadingTalent || loadingProjects;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-popover/95 backdrop-blur-2xl border-border rounded-xl shadow-2xl p-8">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <Upload className="size-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Upload Document</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Link a new file to a client, talent, or project for centralized tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entity Type Selection */}
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

            {/* Specific Entity Selection */}
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

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">File Attachment</Label>
            <div className={`transition-opacity duration-300 ${!selectedEntityId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <UploadDropzone
                endpoint="documentUploader"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => {
                  toast.error(`Upload failed: ${error.message}`);
                }}
                appearance={{
                  container: "border border-dashed border-border bg-card/50 rounded-2xl h-52 hover:border-primary hover:bg-primary/5 transition-all duration-300",
                  label: "text-foreground font-semibold text-sm",
                  allowedContent: "text-xs text-muted-foreground mt-1",
                  button: "bg-primary text-primary-foreground font-medium rounded-lg px-6 py-2 text-sm shadow-sm hover:bg-primary/90 transition-colors mt-4",
                }}
                content={{
                  label: "Drag & drop files here",
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="h-12 rounded-xl font-bold px-6 w-full"
            disabled={isUploading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
