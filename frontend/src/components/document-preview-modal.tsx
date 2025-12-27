"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Image as ImageIcon, X, FileType } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    file_url: string;
    file_type?: string;
    ocr_status?: string;
    content?: string;
  } | null;
}

export function DocumentPreviewModal({ open, onOpenChange, document }: DocumentPreviewModalProps) {
  if (!document) return null;

  const isPdf = document.file_type?.toLowerCase().includes("pdf") || document.file_url.toLowerCase().endsWith(".pdf");
  const isImage = document.file_type?.toLowerCase().includes("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_url);
  const hasOcrContent = document.ocr_status === 'COMPLETED' && document.content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border overflow-hidden rounded-[2rem] [&>button]:hidden z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {isImage ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-base font-bold truncate max-w-md flex items-center gap-2">
                {document.name}
                {hasOcrContent && <Badge variant="outline" className="text-[10px] h-5 bg-background">OCR READY</Badge>}
              </DialogTitle>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {isPdf ? "PDF Document" : isImage ? "Image Preview" : "File Preview"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 font-bold hidden sm:flex" asChild>
              <a href={document.file_url} download target="_blank" rel="noopener noreferrer">
                <Download className="size-4" /> Download
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground" onClick={() => onOpenChange(false)}>
                <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-muted/10 p-4 sm:p-8 flex items-center justify-center overflow-hidden relative">
          {isPdf ? (
            <iframe
              src={`${document.file_url}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded-xl border border-border/50 shadow-2xl bg-white"
              title="PDF Preview"
            />
          ) : isImage ? (
            <img
              src={document.file_url}
              alt={document.name}
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <FileText className="size-10 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Preview not available</h3>
                <p className="text-muted-foreground">This file type cannot be previewed directly.</p>
              </div>
               <Button asChild className="rounded-xl font-bold">
                  <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 mr-2" /> Open File
                  </a>
               </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
