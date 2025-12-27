
import ContextualContractsPage, { ContextualContractsViewSkeleton } from "@/components/contextual-contracts-view";
import { Suspense } from "react";

export default function TalentContractsPage() {
  return (
    <Suspense fallback={<ContextualContractsViewSkeleton />}>
      <ContextualContractsPage 
        title="Talent Contracts" 
        description="Manage individual agreements, NDAs, and contractor SOWs."
        filterType="TALENT"
      />
    </Suspense>
  );
}
