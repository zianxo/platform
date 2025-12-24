"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";

// Helper since backend get(id) might not be fully implemented in api.ts types yet, but let's assume it works or use list find
function useInvoiceDetail(id: string) {
    const { data } = useQuery({ queryKey: ["invoices"], queryFn: api.invoices.list });
    return data?.find(t => t.id === id);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const invoice = useInvoiceDetail(id);

  if (!invoice) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoice.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground">{invoice.billing_month}</p>
        </div>
        <div className="ml-auto">
             <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.line_items?.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell className="text-right">${item.amount}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="font-bold">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">${invoice.total_amount} {invoice.currency}</TableCell>
                            </TableRow>
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </div>
        
         <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader>
                <CardContent>
                    <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>
                        {invoice.status}
                    </Badge>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
