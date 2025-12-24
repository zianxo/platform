import { DocumentsView, DocumentsViewSkeleton } from "@/components/documents-view";
import { Suspense } from "react";

export default function ClientDocumentsPage() {
  return (
    <Suspense fallback={<DocumentsViewSkeleton />}>
      <DocumentsView 
        title="Client Documents" 
        description="MSAs, NDAs, and other administrative files for your clients." 
        initialEntityType="CLIENT"
      />
    </Suspense>
  );
}
