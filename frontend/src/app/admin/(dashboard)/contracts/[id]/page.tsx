"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// Helper 
function useContractDetail(id: string) {
    const { data } = useQuery({ queryKey: ["contracts"], queryFn: api.contracts.list });
    return data?.find(t => t.id === id);
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const contract = useContractDetail(id);

  if (!contract) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contract: {contract.type}</h1>
          <p className="text-muted-foreground">{new Date(contract.start_date).toLocaleDateString()} - {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "Ongoing"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 bg-muted/20 rounded-lg border font-mono text-sm whitespace-pre-wrap">
                       {/* Mock Terms */}
                       1. SCOPE OF SERVICES...{"\n"}
                       2. COMPENSATION...{"\n"}
                       3. CONFIDENTIALITY...
                   </div>
                </CardContent>
            </Card>
        </div>
        
         <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader>
                <CardContent>
                    <Badge variant={contract.status === 'SIGNED' ? 'default' : 'secondary'}>
                        {contract.status}
                    </Badge>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Notice Period</CardTitle></CardHeader>
                <CardContent>
                    {contract.notice_period_days} Days
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
