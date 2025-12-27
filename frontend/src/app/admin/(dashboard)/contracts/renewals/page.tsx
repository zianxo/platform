import ContextualContractsPage, { ContextualContractsViewSkeleton } from "@/components/contextual-contracts-view";
import { Suspense } from "react";

export default function ContractRenewalsPage() {
  return (
    <Suspense fallback={<ContextualContractsViewSkeleton />}>
      <ContextualContractsPage 
        title="Upcoming Renewals" 
        description="Identify and manage contracts reaching their end-date in the next 60 days."
        filterType="RENEWALS"
      />
    </Suspense>
  );
}
