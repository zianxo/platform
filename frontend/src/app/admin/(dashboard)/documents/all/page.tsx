import { DocumentsView, DocumentsViewSkeleton } from "@/components/documents-view";
import { Suspense } from "react";

export default function DocumentsAllPage() {
  return (
    <Suspense fallback={<DocumentsViewSkeleton />}>
      <DocumentsView 
        title="Documents" 
        description="Manage contracts, agreements, and compliance records across your organization." 
        initialEntityType="ALL"
      />
    </Suspense>
  );
}
