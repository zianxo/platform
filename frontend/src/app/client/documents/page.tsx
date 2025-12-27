"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ClientDocumentsPage() {
    const { data: documents, isLoading } = useQuery({
        queryKey: ["documents"],
        queryFn: api.documents.list
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48 rounded-md" />
                        <Skeleton className="h-4 w-64 mt-2 rounded-md" />
                    </div>
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Documents</h1>
                    <p className="text-muted-foreground mt-2"> Contracts, Invoices, and Legal Agreements.</p>
                </div>
                <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Upload className="size-4 mr-2" />
                    Upload
                </Button>
            </div>

            {documents && documents.length > 0 ? (
                <div className="grid gap-3">
                    {documents.map((doc: any) => (
                        <Card key={doc.id} className="rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden ring-1 ring-border/5">
                            <CardContent className="flex justify-between items-center p-4 bg-card">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                        <FileText className="size-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-base group-hover:text-primary transition-colors">{doc.file_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] bg-muted/50 border-border/50 uppercase tracking-wide text-muted-foreground">
                                                {(doc.file_size / 1024).toFixed(0)} KB
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">•</span>
                                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" asChild className="rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 border-border/50 shadow-none bg-muted/5 rounded-xl">
                    <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                            <FileText className="size-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">No documents found</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-[300px]">Your repository is empty.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
