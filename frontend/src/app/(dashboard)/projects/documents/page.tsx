import { DocumentsView, DocumentsViewSkeleton } from "@/components/documents-view";
import { Suspense } from "react";

export default function ProjectDocumentsPage() {
  return (
    <Suspense fallback={<DocumentsViewSkeleton />}>
      <DocumentsView 
        title="Project Documents" 
        description="Contracts, SOWs, and deliverables specifically for projects." 
        initialEntityType="PROJECT"
      />
    </Suspense>
  );
}
