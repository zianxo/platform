"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientContext } from "@/components/providers/client-provider";
import { api } from "@/lib/api";
import { 
  Search, 
  FileText, 
  Filter, 
  Upload, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  ExternalLink,
  Building2,
  Users,
  Briefcase,
  ChevronDown,
  Clock,
  CheckCircle2,
  FileCode,
  AlertCircle,
  Eye,
  Edit
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { DocumentPreviewModal } from "./document-preview-modal";
import { EditDocumentModal } from "./edit-document-modal";
import { UploadDocumentModal } from "./upload-document-modal";

interface DocumentsViewProps {
  title?: string;
  description?: string;
  initialEntityType?: "CLIENT" | "TALENT" | "PROJECT" | "ALL";
  initialEntityId?: string;
}

// Reusable Documents View Component
export function DocumentsView({ title, description, initialEntityType, initialEntityId }: DocumentsViewProps) {
  const { activeClient } = useClientContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState(() => {
    const status = searchParams.get("status");
    return status ? status.toUpperCase() : "ALL";
  });

  const [typeFilter, setTypeFilter] = useState(() => {
    const type = searchParams.get("type");
    return type ? type.toUpperCase() : initialEntityType || "ALL";
  });

  const [entityIdFilter, setEntityIdFilter] = useState(() => {
    return searchParams.get("entityId") || initialEntityId || "";
  });

  const { data: rawDocuments, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: api.documents.list,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: api.clients.list,
  });

  const { data: talent } = useQuery({
    queryKey: ["talent"],
    queryFn: api.talent.list,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });

  const queryClient = useQueryClient();

  const enrichedDocuments = useMemo(() => {
    if (!rawDocuments) return [];

    return rawDocuments.map(doc => {
      let entityName = "Unknown Entity";
      if (doc.entity_type === "CLIENT") {
        entityName = clients?.find(c => c.id === doc.entity_id)?.company_name || "Unknown Client";
      } else if (doc.entity_type === "TALENT") {
        const t = talent?.find(t => t.id === doc.entity_id);
        entityName = t ? `${t.first_name} ${t.last_name}` : "Unknown Talent";
      } else if (doc.entity_type === "PROJECT") {
        entityName = projects?.find(p => p.id === doc.entity_id)?.name || "Unknown Project";
      }

      // Format size
      const sizeMB = doc.file_size ? (doc.file_size / (1024 * 1024)).toFixed(1) + " MB" : "0 MB";

      return {
        ...doc,
        name: doc.file_name,
        entity_name: entityName,
        size: sizeMB,
        // Backend now returns status, defaulting to DRAFT
      };
    });
  }, [rawDocuments, clients, talent, projects]);

  const handleDelete = async (id: string) => {
    try {
      await api.documents.delete(id);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.documents.update(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Reactive sync with URL
  useEffect(() => {
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    if (status) setStatusFilter(status.toUpperCase());
    else setStatusFilter("ALL");

    if (type) setTypeFilter(type.toUpperCase());
    else setTypeFilter(initialEntityType || "ALL");
  }, [searchParams, initialEntityType]);

  const handleFilterChange = (key: "status" | "type", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value.toLowerCase());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredDocs = useMemo(() => {
    if (!enrichedDocuments) return [];
    return enrichedDocuments.filter(doc => {
      const searchLower = (search || "").toLowerCase();
      const docNameLower = (doc.name || "").toLowerCase();
      const entityNameLower = (doc.entity_name || "").toLowerCase();

      const matchesSearch = docNameLower.includes(searchLower) ||
                           entityNameLower.includes(searchLower);
      const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
      const matchesType = typeFilter === "ALL" || doc.entity_type === typeFilter;
      const matchesEntity = !entityIdFilter || doc.entity_id === entityIdFilter;

      // Global Client Context Logic
      let matchesClient = !activeClient;
      if (activeClient) {
        if (doc.entity_type === 'CLIENT') {
          matchesClient = doc.entity_id === activeClient.id;
        } else if (doc.entity_type === 'PROJECT') {
          // Check if project belongs to active client
          const project = projects?.find(p => p.id === doc.entity_id);
          matchesClient = !!project && project.client_id === activeClient.id;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesEntity && matchesClient;
    });
  }, [enrichedDocuments, search, statusFilter, typeFilter, entityIdFilter, activeClient]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SIGNED":
        return { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 };
      case "REVIEW":
        return { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock };
      case "DRAFT":
        return { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: FileText };
      case "EXPIRED":
        return { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle };
      default:
        return { color: "bg-primary/10 text-primary border-primary/20", icon: FileText };
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "CLIENT": return <Building2 className="size-3.5" />;
      case "TALENT": return <Users className="size-3.5" />;
      case "PROJECT": return <Briefcase className="size-3.5" />;
      default: return <FileText className="size-3.5" />;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm font-medium">{description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all border-none gap-2"
          >
            <Upload className="size-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by file name or source..." 
            className="h-12 pl-11 pr-4 bg-card border-border/50 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          {initialEntityType === "ALL" && (
            <Select value={typeFilter} onValueChange={(val) => handleFilterChange("type", val)}>
              <SelectTrigger className="w-[160px] h-12 bg-card border-border/50 rounded-xl font-bold text-xs uppercase tracking-wider focus:ring-primary/20 shadow-sm px-5">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
                <SelectItem value="ALL" className="text-xs font-bold uppercase tracking-wider">All Sources</SelectItem>
                <SelectItem value="CLIENT" className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10">Clients</SelectItem>
                <SelectItem value="TALENT" className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10">Talent</SelectItem>
                <SelectItem value="PROJECT" className="text-xs font-bold uppercase tracking-wider focus:bg-primary/10">Projects</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={(val) => handleFilterChange("status", val)}>
            <SelectTrigger className="w-[180px] h-12 bg-card border-border/50 rounded-xl font-bold text-xs uppercase tracking-wider focus:ring-primary/20 shadow-sm px-5">
              <div className="flex items-center gap-2">
                <Filter className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover/90 backdrop-blur-xl border-border rounded-xl">
              <SelectItem value="ALL" className="text-xs font-bold uppercase tracking-wider">All Statuses</SelectItem>
              <SelectItem value="SIGNED" className="text-xs font-bold uppercase tracking-wider text-emerald-500 focus:bg-emerald-500/10">Signed</SelectItem>
              <SelectItem value="REVIEW" className="text-xs font-bold uppercase tracking-wider text-amber-500 focus:bg-amber-500/10">Under Review</SelectItem>
              <SelectItem value="DRAFT" className="text-xs font-bold uppercase tracking-wider text-slate-500 focus:bg-slate-500/10">Draft</SelectItem>
              <SelectItem value="EXPIRED" className="text-xs font-bold uppercase tracking-wider text-destructive focus:bg-destructive/10">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Document Grid */}
      {isLoadingDocs ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-card border border-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {filteredDocs.map((doc) => {
          const status = getStatusConfig(doc.status);
          const StatusIcon = status.icon;

          return (
            <Card 
              key={doc.id} 
              className="group border-border/40 bg-card overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 ring-1 ring-border/5 cursor-pointer"
              onClick={() => {
                setSelectedDocument(doc);
                setIsPreviewOpen(true);
              }}
            >
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="size-12 rounded-xl bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <FileText className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-border rounded-xl" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="size-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg" onClick={(e) => e.stopPropagation()}>
                          <a href={doc.file_url} download onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 w-full">
                            <Download className="size-4" /> Download
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                          <ExternalLink className="size-4" /> View Original
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="size-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Change Status</DropdownMenuLabel>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg text-emerald-500 focus:bg-emerald-500/10"
                          onClick={() => handleUpdateStatus(doc.id, "SIGNED")}
                        >
                          <CheckCircle2 className="size-4" /> Mark Signed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg text-amber-500 focus:bg-amber-500/10"
                          onClick={() => handleUpdateStatus(doc.id, "REVIEW")}
                        >
                          <Clock className="size-4" /> Move to Review
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg text-slate-500 focus:bg-slate-500/10"
                          onClick={() => handleUpdateStatus(doc.id, "DRAFT")}
                        >
                          <FileText className="size-4" /> Mark as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer rounded-lg text-destructive focus:bg-destructive/10"
                          onClick={() => handleUpdateStatus(doc.id, "EXPIRED")}
                        >
                          <AlertCircle className="size-4" /> Mark as Expired
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 rounded-lg"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm leading-tight line-clamped-2 group-hover:text-primary transition-colors min-h-[40px]">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${status.color}`}>
                        <StatusIcon className="size-3 mr-1" />
                        {doc.status}
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{doc.file_type || 'PDF'}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/30 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">Source</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/80 truncate">
                        {getEntityIcon(doc.entity_type)}
                        {doc.entity_name}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">Date</span>
                      <div className="text-[11px] font-bold text-foreground/80">
                        {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl">
            <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Search className="size-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">No documents found</h3>
            <p className="text-muted-foreground text-sm font-medium">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
      )}

      <UploadDocumentModal 
        open={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
        defaultType={typeFilter === "ALL" ? "ALL" : typeFilter as any}
        defaultEntityId={entityIdFilter || (activeClient && typeFilter === "CLIENT" ? activeClient.id : "")}
      />

      <DocumentPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        document={selectedDocument}
      />

      <EditDocumentModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        document={selectedDocument}
      />
    </div>
  );
}

export function DocumentsViewSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <Skeleton className="h-10 w-64 rounded-xl mb-2" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 px-2">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
