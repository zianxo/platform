import { DocumentsView, DocumentsViewSkeleton } from "@/components/documents-view";
import { Suspense } from "react";

export default function TalentDocumentsPage() {
  return (
    <Suspense fallback={<DocumentsViewSkeleton />}>
      <DocumentsView 
        title="Talent Documents" 
        description="Contractor agreements, tax forms, and IDs for your talent pool." 
        initialEntityType="TALENT"
      />
    </Suspense>
  );
}
