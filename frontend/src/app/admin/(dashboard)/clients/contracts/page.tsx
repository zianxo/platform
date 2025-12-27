
import ContextualContractsPage, { ContextualContractsViewSkeleton } from "@/components/contextual-contracts-view";
import { Suspense } from "react";

export default function ClientContractsStandalonePage() {
  return (
    <Suspense fallback={<ContextualContractsViewSkeleton />}>
      <ContextualContractsPage 
        title="Client Agreements" 
        description="Manage Master Service Agreements and SOWs for all active clients."
        filterType="CLIENT"
      />
    </Suspense>
  );
}
