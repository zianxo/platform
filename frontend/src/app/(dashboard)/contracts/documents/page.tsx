import { DocumentsView, DocumentsViewSkeleton } from "@/components/documents-view";
import { Suspense } from "react";

export default function ContractDocumentsPage() {
  return (
    <Suspense fallback={<DocumentsViewSkeleton />}>
      <DocumentsView 
        title="Contract Documents" 
        description="Direct access to all generated and signed contract files." 
        initialEntityType="ALL" 
      />
    </Suspense>
  );
}
