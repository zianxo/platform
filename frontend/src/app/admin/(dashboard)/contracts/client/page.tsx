
import ContextualContractsPage, { ContextualContractsViewSkeleton } from "@/components/contextual-contracts-view";
import { Suspense } from "react";

export default function ClientContractsPage() {
  return (
    <Suspense fallback={<ContextualContractsViewSkeleton />}>
      <ContextualContractsPage 
        title="Client Contracts" 
        description="Manage Master Service Agreements and Statements of Work for all clients."
        filterType="CLIENT"
      />
    </Suspense>
  );
}
